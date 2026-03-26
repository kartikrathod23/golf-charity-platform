import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  void auth;

  const supabase = getSupabaseAdmin();

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  const { count: activeSubscriptions } = await supabase
    .from("subscriptions")
    .select("id", { count: "exact", head: true });

  const { data: prizeRows } = await supabase
    .from("draws")
    .select("prize_pool_total")
    .eq("status", "published");

  const totalPrizePoolCents = (prizeRows ?? []).reduce(
    (sum, r) => sum + Number(r.prize_pool_total ?? 0),
    0,
  );

  const { data: donationRows } = await supabase
    .from("donations")
    .select("amount")
    .eq("donation_type", "subscription_contribution");

  const totalCharityContribCents = (donationRows ?? []).reduce(
    (sum, r) => sum + Number(r.amount ?? 0),
    0,
  );

  return NextResponse.json({
    ok: true,
    stats: {
      totalUsers: totalUsers ?? 0,
      activeSubscriptions: activeSubscriptions ?? 0,
      totalPrizePoolCents,
      totalCharityContribCents,
    },
  });
}

