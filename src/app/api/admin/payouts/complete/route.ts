import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";

const BodySchema = z.object({
  payoutId: z.string().optional(),
  winnerId: z.string().optional(),
});

export async function POST(req: Request) {
  const res = await requireAdmin();
  if (res instanceof NextResponse) return res;
  void res;

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { payoutId, winnerId } = parsed.data;
  if (!payoutId && !winnerId) {
    return NextResponse.json({ error: "Provide payoutId or winnerId" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const completedAt = new Date().toISOString();

  if (payoutId) {
    const { error } = await supabase
      .from("payouts")
      .update({ status: "completed", completed_at: completedAt })
      .eq("id", payoutId);

    if (error) {
      return NextResponse.json({ error: "Failed to complete payout" }, { status: 500 });
    }
  } else if (winnerId) {
    const { error } = await supabase
      .from("payouts")
      .update({ status: "completed", completed_at: completedAt })
      .eq("winner_id", winnerId);

    if (error) {
      return NextResponse.json({ error: "Failed to complete payout" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

