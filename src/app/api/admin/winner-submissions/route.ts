import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  void auth;

  const supabase = getSupabaseAdmin();

  const { data: submissions, error } = await supabase
    .from("winner_submissions")
    .select("id,winner_id,draw_id,profile_id,proof_status,created_at,admin_feedback")
    .eq("proof_status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to load winner submissions" },
      { status: 500 },
    );
  }

  const winnerIds = (submissions ?? []).map((s) => s.winner_id as string);
  const { data: winners } = winnerIds.length
    ? await supabase
        .from("draw_winners")
        .select("id,tier")
        .in("id", winnerIds)
    : { data: [] };

  const tierByWinnerId = new Map<string, number>();
  for (const w of winners ?? []) {
    tierByWinnerId.set(w.id as string, Number(w.tier));
  }

  return NextResponse.json({
    ok: true,
    submissions: (submissions ?? []).map((s) => ({
      id: s.id as string,
      winnerId: s.winner_id as string,
      drawId: s.draw_id as string,
      profileId: s.profile_id as string,
      tier: tierByWinnerId.get(s.winner_id as string) ?? null,
      proofStatus: s.proof_status as string,
      createdAt: s.created_at as string,
      adminFeedback: s.admin_feedback as string | null,
    })),
  });
}

