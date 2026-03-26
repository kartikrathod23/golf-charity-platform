import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth/guards";
import { getEnv, getOptionalEnv } from "@/lib/env";

const BodySchema = z.object({
  planType: z.enum(["monthly", "yearly"]),
  // Optional override for local/dev.
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

function getPriceId(planType: "monthly" | "yearly"): string {
  if (planType === "monthly") return getEnv("STRIPE_PRICE_MONTHLY_ID");
  return getEnv("STRIPE_PRICE_YEARLY_ID");
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { planType, successUrl, cancelUrl } = parsed.data;

  const stripeSecretKey = getEnv("STRIPE_SECRET_KEY");
  const stripe = new Stripe(stripeSecretKey);

  // Create a new Stripe customer each checkout for now.
  // (Later milestone can optimize by reusing `stripe_customer_id`.)
  const customer = await stripe.customers.create({
    email: auth.profile.email,
    metadata: { profileId: auth.profile.id },
  });

  const baseUrl =
    getOptionalEnv("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: [{ price: getPriceId(planType), quantity: 1 }],
    success_url:
      successUrl ?? `${baseUrl}/dashboard?checkout=success`,
    cancel_url: cancelUrl ?? `${baseUrl}/dashboard?checkout=cancel`,
    metadata: { profileId: auth.profile.id, planType },
    subscription_data: {
      metadata: { profileId: auth.profile.id, planType },
    },
  });

  return NextResponse.json({
    ok: true,
    sessionId: session.id,
    // Prefer redirect URL for browser clients.
    url: session.url,
  });
}

