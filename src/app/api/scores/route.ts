import { NextResponse } from "next/server";
import { requireActiveSubscription } from "@/lib/auth/guards";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";

export async function GET() {
  const auth = await requireActiveSubscription();
  if (auth instanceof NextResponse) return auth;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_scores")
    .select("id,score_date,stableford_score")
    .eq("profile_id", auth.profile.id)
    .order("score_date", { ascending: false })
    .limit(5);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch scores" },
      { status: 500 },
    );
  }

  type ScoreRow = {
    id: string;
    score_date: string;
    stableford_score: number;
  };
  const rows = (data ?? []) as ScoreRow[];

  return NextResponse.json({
    ok: true,
    scores: rows.map((s) => ({
      id: s.id,
      scoreDate: s.score_date,
      stablefordScore: s.stableford_score,
    })),
  });
}

const BodySchema = z.object({
  scoreDate: z
    .string()
    .regex(/^\\d{4}-\\d{2}-\\d{2}$/)
    .refine((v) => !Number.isNaN(new Date(v).getTime()), {
      message: "Invalid date",
    }),
  stablefordScore: z.number().int().min(1).max(45),
});

export async function POST(req: Request) {
  const auth = await requireActiveSubscription();
  if (auth instanceof NextResponse) return auth;

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { scoreDate, stablefordScore } = parsed.data;
  const supabase = getSupabaseAdmin();

  // Upsert by (profile_id, score_date) via update-or-insert.
  const { data: existing } = await supabase
    .from("user_scores")
    .select("id")
    .eq("profile_id", auth.profile.id)
    .eq("score_date", scoreDate)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("user_scores")
      .update({ stableford_score: stablefordScore })
      .eq("id", existing.id);
  } else {
    await supabase.from("user_scores").insert({
      profile_id: auth.profile.id,
      score_date: scoreDate,
      stableford_score: stablefordScore,
    });
  }

  // Enforce rolling window: keep only the latest 5 scores.
  type ScoreIdRow = { id: string; score_date: string };
  const { data: ordered } = await supabase
    .from("user_scores")
    .select("id,score_date")
    .eq("profile_id", auth.profile.id)
    .order("score_date", { ascending: false })
    .limit(100);

  const rows = (ordered ?? []) as ScoreIdRow[];
  if (rows.length > 5) {
    const idsToDelete = rows.slice(5).map((r) => r.id);
    if (idsToDelete.length > 0) {
      await supabase.from("user_scores").delete().in("id", idsToDelete);
    }
  }

  // Return latest 5.
  const { data: latest } = await supabase
    .from("user_scores")
    .select("id,score_date,stableford_score")
    .eq("profile_id", auth.profile.id)
    .order("score_date", { ascending: false })
    .limit(5);

  type LatestRow = {
    id: string;
    score_date: string;
    stableford_score: number;
  };
  const latestRows = (latest ?? []) as LatestRow[];

  return NextResponse.json({
    ok: true,
    scores: latestRows.map((s) => ({
      id: s.id,
      scoreDate: s.score_date,
      stablefordScore: s.stableford_score,
    })),
  });
}

