import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";
import type { Score } from "@/lib/db/types";

export async function insertScore(input: {
  profileId: string;
  scoreDate: string; // YYYY-MM-DD
  stablefordScore: number;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from("user_scores").insert({
    profile_id: input.profileId,
    score_date: input.scoreDate,
    stableford_score: input.stablefordScore,
  });
}

export async function listLatestScores(input: {
  profileId: string;
  limit: number;
}): Promise<Score[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_scores")
    .select("id,profile_id,score_date,stableford_score")
    .eq("profile_id", input.profileId)
    .order("score_date", { ascending: false })
    .limit(input.limit);

  if (error || !data) return [];

  type ScoreRow = {
    id: string;
    profile_id: string;
    score_date: string;
    stableford_score: number;
  };

  const rows = data as ScoreRow[];
  return rows.map((s) => ({
    id: s.id,
    profileId: s.profile_id,
    scoreDate: s.score_date,
    stablefordScore: s.stableford_score,
  }));
}

