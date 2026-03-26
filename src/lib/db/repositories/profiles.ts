import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";
import type { Profile } from "@/lib/db/types";

export async function getProfileById(profileId: string): Promise<Profile | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,role,charity_id,contribution_percent")
    .eq("id", profileId)
    .maybeSingle();

  if (error || !data) return null;

  const role = data.role as Profile["role"];
  return {
    id: data.id,
    email: data.email,
    role,
    charityId: data.charity_id ?? null,
    contributionPercent: data.contribution_percent ?? null,
  };
}

export async function getProfileByEmail(email: string): Promise<Profile | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,role,charity_id,contribution_percent")
    .eq("email", email)
    .maybeSingle();

  if (error || !data) return null;

  const role = data.role as Profile["role"];
  return {
    id: data.id,
    email: data.email,
    role,
    charityId: data.charity_id ?? null,
    contributionPercent: data.contribution_percent ?? null,
  };
}

