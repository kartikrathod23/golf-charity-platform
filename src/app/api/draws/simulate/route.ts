import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { z } from "zod";
import Stripe from "stripe";
import { getEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";

const BodySchema = z.object({
  monthStart: z
    .string()
    .regex(/^\\d{4}-\\d{2}-\\d{2}$/)
    .transform((v) => new Date(v + "T00:00:00.000Z"))
    .refine((d) => !Number.isNaN(d.getTime()), { message: "Invalid date" }),
  logicMode: z.enum(["random", "algorithmic"]),
});

const STABLEFORD_MIN = 1;
const STABLEFORD_MAX = 45;
const PRIZE_POOL_CONTRIBUTION_RATIO = 0.2; // PRD: fixed portion of subscription; placeholder ratio.

type WinnerTier = 3 | 4 | 5;

function uniformSampleWithoutReplacement(
  min: number,
  max: number,
  k: number,
): number[] {
  const pool: number[] = [];
  for (let i = min; i <= max; i += 1) pool.push(i);
  const out: number[] = [];
  while (out.length < k && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}

function weightedSampleWithoutReplacement(
  values: number[],
  weights: number[],
  k: number,
): number[] {
  const chosen: number[] = [];
  const remainingValues = [...values];
  const remainingWeights = [...weights];

  while (chosen.length < k && remainingValues.length > 0) {
    const total = remainingWeights.reduce((a, b) => a + b, 0);
    if (total <= 0) break;

    let r = Math.random() * total;
    let idx = 0;
    for (; idx < remainingWeights.length; idx += 1) {
      r -= remainingWeights[idx];
      if (r <= 0) break;
    }

    chosen.push(remainingValues[idx]);
    remainingValues.splice(idx, 1);
    remainingWeights.splice(idx, 1);
  }

  // If weights are too skewed, top up uniformly.
  while (chosen.length < k) {
    const remaining = values.filter((v) => !chosen.includes(v));
    if (remaining.length === 0) break;
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    chosen.push(pick);
  }

  return chosen;
}

async function getActiveProfiles(supabase: ReturnType<typeof getSupabaseAdmin>) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("profile_id,plan_type")
    .eq("status", "active");

  if (error || !data) return [];

  // Distinct profile_ids, keeping the first plan_type for prize calculation.
  const byProfile = new Map<string, { profileId: string; planType: string }>();
  for (const row of data) {
    const profileId = row.profile_id as string;
    const planType = row.plan_type as string;
    if (!byProfile.has(profileId)) {
      byProfile.set(profileId, { profileId, planType });
    }
  }
  return [...byProfile.values()];
}

function computePrizePoolsCents(params: {
  totalContributionCents: number;
}) {
  const prizePoolTotal = Math.floor(
    params.totalContributionCents * PRIZE_POOL_CONTRIBUTION_RATIO,
  );

  const prize_pool_5_base = Math.floor(prizePoolTotal * 0.4);
  const prize_pool_4 = Math.floor(prizePoolTotal * 0.35);
  const prize_pool_3 = prizePoolTotal - prize_pool_5_base - prize_pool_4; // ensure totals.

  return {
    prizePoolTotalCents: prizePoolTotal,
    prize_pool_5_base: prize_pool_5_base,
    prize_pool_4,
    prize_pool_3,
  };
}

function getStablefordFrequency(allScores: number[]): number[] {
  const freq = Array.from({ length: STABLEFORD_MAX + 1 }, () => 0);
  for (const n of allScores) {
    if (n < STABLEFORD_MIN || n > STABLEFORD_MAX) continue;
    freq[n] += 1;
  }
  return freq;
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { monthStart, logicMode } = parsed.data;
  const monthStartIso = monthStart.toISOString().slice(0, 10);

  const supabase = getSupabaseAdmin();

  const active = await getActiveProfiles(supabase);
  if (active.length === 0) {
    return NextResponse.json({
      ok: true,
      monthStart: monthStartIso,
      logicMode,
      drawnNumbers: [],
      winners: { "3": [], "4": [], "5": [] },
      prizePool: { totalCents: 0, prizePool5Cents: 0, prizePool4Cents: 0, prizePool3Cents: 0 },
      rolloverToNextCents: 0,
    });
  }

  // Fetch latest 5 scores for each active profile.
  const participantScores = new Map<string, number[]>();
  const allScoresForWeights: number[] = [];
  for (const row of active) {
    const { data, error } = await supabase
      .from("user_scores")
      .select("stableford_score")
      .eq("profile_id", row.profileId)
      .order("score_date", { ascending: false })
      .limit(5);

    if (error || !data) continue;
    if (data.length < 5) continue;

    const scores = data.map((s) => s.stableford_score as number);
    participantScores.set(row.profileId, scores);
    allScoresForWeights.push(...scores);
  }

  const participants = [...participantScores.entries()];
  const drawnNumbers =
    logicMode === "random"
      ? uniformSampleWithoutReplacement(
          STABLEFORD_MIN,
          STABLEFORD_MAX,
          5,
        )
      : (() => {
          const freq = getStablefordFrequency(allScoresForWeights);
          const max = Math.max(...freq.slice(STABLEFORD_MIN), 1);
          const values: number[] = [];
          const weights: number[] = [];

          for (let n = STABLEFORD_MIN; n <= STABLEFORD_MAX; n += 1) {
            const c = freq[n];
            const norm = c / max;
            // Prefer both extremes: high-frequency and low-frequency.
            const weight = 0.5 * norm + 0.5 * (1 - norm);
            values.push(n);
            weights.push(weight);
          }

          return weightedSampleWithoutReplacement(values, weights, 5);
        })();

  // Determine winners by tier based on set membership.
  const winnerIdsByTier: Record<WinnerTier, string[]> = {
    3: [],
    4: [],
    5: [],
  };

  for (const [profileId, scores] of participants) {
    const scoreSet = new Set(scores);
    const matchCount = drawnNumbers.filter((n) => scoreSet.has(n)).length;
    if (matchCount === 5) winnerIdsByTier[5].push(profileId);
    else if (matchCount === 4) winnerIdsByTier[4].push(profileId);
    else if (matchCount === 3) winnerIdsByTier[3].push(profileId);
  }

  // Prize pool calculation from active subscription plans.
  const stripe = new Stripe(getEnv("STRIPE_SECRET_KEY"));
  const monthlyPriceId = getEnv("STRIPE_PRICE_MONTHLY_ID");
  const yearlyPriceId = getEnv("STRIPE_PRICE_YEARLY_ID");

  const [monthlyPrice, yearlyPrice] = await Promise.all([
    stripe.prices.retrieve(monthlyPriceId),
    stripe.prices.retrieve(yearlyPriceId),
  ]);

  const monthlyUnitAmount = monthlyPrice.unit_amount ?? 0;
  const yearlyUnitAmount = yearlyPrice.unit_amount ?? 0;

  const totalContributionCents = active.reduce((sum, s) => {
    if (s.planType === "yearly") return sum + yearlyUnitAmount;
    return sum + monthlyUnitAmount;
  }, 0);

  const { prizePoolTotalCents, prize_pool_5_base, prize_pool_4, prize_pool_3 } =
    computePrizePoolsCents({ totalContributionCents });

  // Jackpot rollover: carry previous month 5-tier pool if nobody qualified for tier 5.
  const prev = new Date(monthStart);
  prev.setUTCMonth(prev.getUTCMonth() - 1);
  const prevIso = prev.toISOString().slice(0, 10);

  const { data: prevDraw } = await supabase
    .from("draws")
    .select("id,prize_pool_5")
    .eq("month_start", prevIso)
    .maybeSingle();

  let rolloverFromPrevCents = 0;
  if (prevDraw?.id) {
    const { data: prevFive } = await supabase
      .from("draw_winners")
      .select("id")
      .eq("draw_id", prevDraw.id as string)
      .eq("tier", 5)
      .limit(1);

    if (!prevFive || prevFive.length === 0) {
      rolloverFromPrevCents = Number(prevDraw.prize_pool_5 ?? 0);
    }
  }

  const prizePool5Cents = prize_pool_5_base + rolloverFromPrevCents;
  const winners5Count = winnerIdsByTier[5].length;
  const rolloverToNextCents = winners5Count === 0 ? prizePool5Cents : 0;

  return NextResponse.json({
    ok: true,
    monthStart: monthStartIso,
    logicMode,
    drawnNumbers,
    winners: {
      3: winnerIdsByTier[3],
      4: winnerIdsByTier[4],
      5: winnerIdsByTier[5],
    },
    prizePool: {
      totalCents: prizePoolTotalCents,
      prizePool5Cents,
      prizePool4Cents: prize_pool_4,
      prizePool3Cents: prize_pool_3,
    },
    rolloverToNextCents,
  });
}

