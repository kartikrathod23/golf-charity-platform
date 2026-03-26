import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";
import { requireAuth } from "@/lib/auth/guards";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const supabase = getSupabaseAdmin();

  const now = new Date();
  const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const currentMonthStartIso = currentMonthStart.toISOString().slice(0, 10);

  // Subscription status (active/inactive/renewal date)
  const { data: subscription, error: subErr } = await supabase
    .from("subscriptions")
    .select("status,renewal_date,plan_type")
    .eq("profile_id", auth.profile.id)
    .order("renewal_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subErr) {
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 },
    );
  }

  // Participation summary
  const { data: drawWinnersRows } = await supabase
    .from("draw_winners")
    .select("draw_id")
    .eq("profile_id", auth.profile.id);

  const drawsEntered = (drawWinnersRows ?? []).length;

  const { data: upcomingDraws } = await supabase
    .from("draws")
    .select("id,month_start,status")
    .gte("month_start", currentMonthStartIso)
    .order("month_start", { ascending: true })
    .limit(3);

  const enteredDrawIds = new Set(
    (drawWinnersRows ?? []).map((r) => r.draw_id as string),
  );

  const upcomingDrawsCount = (upcomingDraws ?? []).filter((d) => {
    const id = d.id as string;
    return !enteredDrawIds.has(id);
  }).length;

  // Winnings overview
  const { data: myWinnerRows, error: winnersErr } = await supabase
    .from("draw_winners")
    .select("id,prize_amount")
    .eq("profile_id", auth.profile.id);

  if (winnersErr) {
    return NextResponse.json(
      { error: "Failed to fetch winnings" },
      { status: 500 },
    );
  }

  const myWinners = myWinnerRows ?? [];
  const myWinnerIds = myWinners.map((w) => w.id as string);

  let totalWonCents = 0;
  let paymentStatus: "pending" | "paid" | "none" = "none";

  if (myWinnerIds.length > 0) {
    const { data: payoutsRows } = await supabase
      .from("payouts")
      .select("winner_id,status")
      .in("winner_id", myWinnerIds);

    const payoutByWinnerId = new Map<string, string>();
    for (const p of payoutsRows ?? []) {
      payoutByWinnerId.set(p.winner_id as string, p.status as string);
    }

    for (const w of myWinners) {
      const status = payoutByWinnerId.get(w.id as string);
      if (status === "paid" || status === "completed") {
        totalWonCents += Number(w.prize_amount ?? 0);
      }
    }

    if ((payoutByWinnerId && [...payoutByWinnerId.values()].includes("pending"))) {
      paymentStatus = "pending";
    } else if (totalWonCents > 0) {
      paymentStatus = "paid";
    }
  }

  return NextResponse.json({
    ok: true,
    profile: {
      charityId: auth.profile.charityId,
      contributionPercent: auth.profile.contributionPercent,
    },
    subscription: subscription
      ? {
          status: subscription.status,
          renewalDate: subscription.renewal_date,
          planType: subscription.plan_type,
        }
      : null,
    participation: {
      drawsEntered,
      upcomingDraws: upcomingDrawsCount,
    },
    winnings: {
      totalWonCents,
      paymentStatus,
    },
  });
}

