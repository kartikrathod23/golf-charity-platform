import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";
import { requireAuth } from "@/lib/auth/guards";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const supabase = getSupabaseAdmin();

  const { data: subscription, error } = await supabase
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

  return NextResponse.json({
    profile: auth.profile,
    subscription: subscription ?? null,
  });
}

