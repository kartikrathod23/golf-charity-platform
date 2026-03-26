import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";
import type { Subscription } from "@/lib/db/types";

export async function getLatestSubscriptionForProfile(
  profileId: string,
): Promise<Subscription | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id,profile_id,plan_type,status,renewal_date")
    .eq("profile_id", profileId)
    .order("renewal_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    profileId: data.profile_id,
    planType: data.plan_type,
    status: data.status,
    renewalDate: data.renewal_date ?? null,
  } as Subscription;
}

