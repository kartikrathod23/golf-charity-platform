import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";

const BodySchema = z.object({
  charityId: z.string().min(1),
  amountCents: z.number().int().min(1),
  // Optional: one-time donation payment reference (if you wire Stripe later).
  paymentId: z.string().min(1).optional(),
});

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

  const { charityId, amountCents, paymentId } = parsed.data;

  const supabase = getSupabaseAdmin();

  // Best-effort charity existence check.
  const { data: charity } = await supabase
    .from("charities")
    .select("id")
    .eq("id", charityId)
    .maybeSingle();

  if (!charity) {
    return NextResponse.json({ error: "Invalid charityId" }, { status: 400 });
  }

  await supabase.from("donations").insert({
    profile_id: auth.profile.id,
    charity_id: charityId,
    donation_type: "independent",
    amount: amountCents,
    stripe_payment_intent_id: paymentId ?? null,
  });

  return NextResponse.json({ ok: true });
}

