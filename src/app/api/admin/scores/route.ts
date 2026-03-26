import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";

const BodySchema = z.object({
  profileId: z.string().min(1),
  scoreDate: z
    .string()
    .regex(/^\\d{4}-\\d{2}-\\d{2}$/)
    .refine((v) => !Number.isNaN(new Date(v).getTime()), {
      message: "Invalid date",
    }),
  stablefordScore: z.number().int().min(1).max(45),
});

export async function POST(req: Request) {
  const res = await requireAdmin();
  if (res instanceof NextResponse) return res;
  void res;

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { profileId, scoreDate, stablefordScore } = parsed.data;
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from("user_scores")
    .select("id")
    .eq("profile_id", profileId)
    .eq("score_date", scoreDate)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("user_scores")
      .update({ stableford_score: stablefordScore })
      .eq("id", existing.id);
  } else {
    await supabase.from("user_scores").insert({
      profile_id: profileId,
      score_date: scoreDate,
      stableford_score: stablefordScore,
    });
  }

  // Enforce rolling window: keep only latest 5 scores.
  const { data: ordered } = await supabase
    .from("user_scores")
    .select("id,score_date")
    .eq("profile_id", profileId)
    .order("score_date", { ascending: false })
    .limit(100);

  type ScoreRow = { id: string; score_date: string };
  const rows = (ordered ?? []) as ScoreRow[];
  if (rows.length > 5) {
    const idsToDelete = rows.slice(5).map((r) => r.id);
    if (idsToDelete.length > 0) {
      await supabase.from("user_scores").delete().in("id", idsToDelete);
    }
  }

  return NextResponse.json({ ok: true });
}

