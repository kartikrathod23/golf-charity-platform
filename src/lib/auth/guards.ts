import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/jwt";

type ProfileRow = {
  id: string;
  email: string;
  role: string;
  charityId: string | null;
  contributionPercent: number | null;
};

type SubscriptionRow = {
  status?: string | null;
  renewal_date?: string | null;
};

export async function requireAuth(): Promise<
  { profile: ProfileRow } | NextResponse
> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Awaited<ReturnType<typeof verifyAuthToken>>;
  try {
    payload = await verifyAuthToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,email,role,charity_id,contribution_percent")
    .eq("id", payload.sub)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const typedProfile: ProfileRow = {
    id: profile.id as string,
    email: profile.email as string,
    role: profile.role as string,
    charityId: (profile.charity_id as string | null) ?? null,
    contributionPercent: (profile.contribution_percent as number | null) ?? null,
  };
  return { profile: typedProfile };
}

export async function requireAdmin(): Promise<
  { profile: ProfileRow } | NextResponse
> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (auth.profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return auth;
}

export async function requireActiveSubscription(): Promise<
  { profile: ProfileRow; subscription: SubscriptionRow } | NextResponse
> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status,renewal_date")
    .eq("profile_id", auth.profile.id)
    .order("renewal_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Subscription lookup failed" },
      { status: 500 },
    );
  }

  const subscription = (data ?? {}) as SubscriptionRow;

  const status = subscription.status ?? null;
  const renewalDateRaw = subscription.renewal_date ?? null;
  const renewalDate = renewalDateRaw ? new Date(renewalDateRaw) : null;

  const isActive =
    status === "active" ||
    (renewalDate ? renewalDate.getTime() >= Date.now() : false);

  if (!isActive) {
    return NextResponse.json(
      { error: "Active subscription required" },
      { status: 403 },
    );
  }

  return { profile: auth.profile, subscription };
}

