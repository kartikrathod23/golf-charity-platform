import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  void auth;

  const supabase = getSupabaseAdmin();

  const { data: payoutRows, error: payoutErr } = await supabase
    .from("payouts")
    .select("id,winner_id,status,paid_at")
    .eq("status", "paid")
    .order("paid_at", { ascending: false });

  if (payoutErr) {
    return NextResponse.json(
      { error: "Failed to load pending payouts" },
      { status: 500 },
    );
  }

  const payoutList = payoutRows ?? [];
  const winnerIds = payoutList.map((p) => p.winner_id as string);

  const { data: winnerRows } = winnerIds.length
    ? await supabase
        .from("draw_winners")
        .select("id,draw_id,tier,profile_id,prize_amount")
        .in("id", winnerIds)
    : { data: [] };

  const winnerById = new Map<
    string,
    unknown
  >();
  for (const w of winnerRows ?? []) {
    winnerById.set(w.id as string, w);
  }

  return NextResponse.json({
    ok: true,
    payouts: payoutList.map((p) => {
      const w = winnerById.get(p.winner_id as string) as
        | {
            id: string;
            draw_id: string;
            tier: number;
            profile_id: string;
            prize_amount: number;
          }
        | undefined;
      return {
        id: p.id as string,
        winnerId: p.winner_id as string,
        tier: w?.tier ?? null,
        profileId: w?.profile_id ?? null,
        drawId: w?.draw_id ?? null,
        prizeAmountCents: Number(w?.prize_amount ?? 0),
        paidAt: p.paid_at as string | null,
      };
    }),
  });
}

