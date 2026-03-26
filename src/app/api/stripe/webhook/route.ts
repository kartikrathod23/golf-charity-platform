import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";
import { sendEmail } from "@/lib/email/sendEmail";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripeSecretKey = getEnv("STRIPE_SECRET_KEY");
  const stripeWebhookSecret = getEnv("STRIPE_WEBHOOK_SECRET");

  const stripe = new Stripe(stripeSecretKey);

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      stripeWebhookSecret,
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();

  if (event.type.startsWith("customer.subscription.")) {
    const subscription = event.data.object as Stripe.Subscription;

    const profileId = readStringFromMetadata(
      subscription.metadata,
      "profileId",
    );

    const planType = readStringFromMetadata(
      subscription.metadata,
      "planType",
    ) as "monthly" | "yearly" | null;

    if (!profileId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const currentPeriodEnd = (subscription as unknown as {
      current_period_end?: number;
    }).current_period_end;

    const renewalDate =
      typeof currentPeriodEnd === "number"
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null;

    const status = subscription.canceled_at
      ? "canceled"
      : subscription.status === "active" || subscription.status === "trialing"
        ? "active"
        : "inactive";

    const startedAt =
      typeof subscription.start_date === "number"
        ? new Date(subscription.start_date * 1000).toISOString()
        : null;

    const canceledAt =
      typeof subscription.canceled_at === "number"
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null;

    const inferredPlanType =
      planType ??
      inferPlanTypeFromSubscription(subscription) ??
      "monthly";

    const stripeCustomerId = readStripeCustomerId(subscription.customer);

    // Update if it already exists; otherwise insert.
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle();

    const payload = {
      profile_id: profileId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscription.id,
      plan_type: inferredPlanType,
      status,
      started_at: startedAt,
      renewal_date: renewalDate,
      canceled_at: canceledAt,
    };

    if (existing?.id) {
      await supabase
        .from("subscriptions")
        .update(payload)
        .eq("stripe_subscription_id", subscription.id);
    } else {
      await supabase.from("subscriptions").insert(payload);
    }

    // PRD: Contribution model (minimum 10% of subscription fee).
    // Create a subscription contribution donation record on subscription creation.
    if (event.type === "customer.subscription.created") {
      const unitAmount =
        subscription.items.data[0]?.price.unit_amount ?? 0;

      if (unitAmount > 0) {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("email,charity_id,contribution_percent")
          .eq("id", profileId)
          .maybeSingle();

        const charityId = profileRow?.charity_id ?? null;
        const toEmail = profileRow?.email ?? null;
        if (charityId) {
          const percentRaw = profileRow?.contribution_percent ?? 10;
          const percentNum =
            typeof percentRaw === "number"
              ? percentRaw
              : Number(percentRaw);

          const safePercent = Number.isFinite(percentNum)
            ? Math.max(10, percentNum)
            : 10;

          const contributionCents = Math.floor(
            unitAmount * (safePercent / 100),
          );

          // Best-effort idempotency: use stripe subscription id as a payment id marker.
          const { data: donationExisting } = await supabase
            .from("donations")
            .select("id")
            .eq("stripe_payment_intent_id", subscription.id)
            .maybeSingle();

          if (!donationExisting?.id && contributionCents > 0) {
            await supabase.from("donations").insert({
              profile_id: profileId,
              charity_id: charityId,
              donation_type: "subscription_contribution",
              amount: contributionCents,
              stripe_payment_intent_id: subscription.id,
            });
          }

          if (toEmail) {
            // Best-effort notification; never fail webhook processing.
            void sendEmail({
              to: toEmail,
              subject: "Your subscription is now active",
              text: [
                "Hi!",
                "",
                "Your subscription is now active.",
                "",
                `Charity ID: ${charityId}`,
                `Contribution: ${safePercent}%`,
                renewalDate ? `Renewal: ${renewalDate}` : "",
                "",
                "Thank you for supporting a charity and participating in monthly prize draws.",
              ]
                .filter(Boolean)
                .join("\n"),
            }).catch(() => undefined);
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  }

  // Unhandled events are acknowledged.
  return NextResponse.json({ ok: true });
}

function inferPlanTypeFromSubscription(
  subscription: Stripe.Subscription,
): "monthly" | "yearly" | null {
  const interval = subscription.items.data[0]?.price.recurring?.interval;
  if (interval === "month") return "monthly";
  if (interval === "year") return "yearly";
  return null;
}

function readStripeCustomerId(
  customer: Stripe.Customer | string | Stripe.DeletedCustomer,
): string | null {
  if (typeof customer === "string") return customer;
  if (customer && typeof customer === "object" && "id" in customer) {
    return customer.id ?? null;
  }
  return null;
}

function readStringFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
  key: string,
): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

