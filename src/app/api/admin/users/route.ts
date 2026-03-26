import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  void auth;

  const supabase = getSupabaseAdmin();

  type ProfileRow = {
    id: string;
    email: string;
    role: string;
    charity_id: string | null;
    contribution_percent: number | null;
  };

  type SubscriptionRow = {
    profile_id: string;
    status: string;
    renewal_date: string | null;
    plan_type: string;
  };

  const { data: profiles, error: profilesErr } = await supabase
    .from("profiles")
    .select("id,email,role,charity_id,contribution_percent")
    .order("created_at", { ascending: false });

  if (profilesErr) {
    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 },
    );
  }

  const profileRows = (profiles ?? []) as ProfileRow[];
  const profileIds = profileRows.map((p) => p.id);

  const subLatestByProfileId = new Map<string, SubscriptionRow>();

  if (profileIds.length > 0) {
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("profile_id,status,renewal_date,plan_type")
      .in("profile_id", profileIds)
      .order("renewal_date", { ascending: false });

    for (const sub of (subs ?? []) as SubscriptionRow[]) {
      if (!subLatestByProfileId.has(sub.profile_id)) {
        subLatestByProfileId.set(sub.profile_id, sub);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    users: profileRows.map((p) => {
      const sub = subLatestByProfileId.get(p.id);
      return {
        id: p.id,
        email: p.email,
        role: p.role,
        charityId: p.charity_id ?? null,
        contributionPercent: p.contribution_percent ?? null,
        subscription: sub
          ? {
              status: sub.status,
              renewalDate: sub.renewal_date,
              planType: sub.plan_type,
            }
          : null,
      };
    }),
  });
}

