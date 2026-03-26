import { NextResponse } from "next/server";
import { z } from "zod";
import { getOptionalEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";
import { POST as publishDrawPost } from "../../draws/publish/route";

const BodySchema = z.object({
  monthStart: z
    .string()
    .regex(/^\\d{4}-\\d{2}-\\d{2}$/)
    .optional(),
  logicMode: z.enum(["random", "algorithmic"]).optional(),
});

export async function POST(req: Request) {
  const expected = getOptionalEnv("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");

  const isAuthorized =
    typeof expected === "string" &&
    expected.length > 0 &&
    typeof provided === "string" &&
    provided === expected;

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const monthStartIso = (() => {
    if (parsed.data.monthStart) return parsed.data.monthStart;
    const now = new Date();
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    return d.toISOString().slice(0, 10);
  })();

  const logicMode = parsed.data.logicMode ?? "random";

  const supabase = getSupabaseAdmin();

  // Idempotency: if already published for this month, do nothing.
  const { data: existing } = await supabase
    .from("draws")
    .select("id,status")
    .eq("month_start", monthStartIso)
    .maybeSingle();

  if (existing?.id && existing.status === "published") {
    return NextResponse.json({
      ok: true,
      skipped: true,
      drawId: existing.id,
      monthStart: monthStartIso,
    });
  }

  // Reuse publish endpoint logic (it supports cron auth via header).
  const publishReq = new Request("http://internal/api/draws/publish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cron-secret": expected ?? "",
    },
    body: JSON.stringify({ monthStart: monthStartIso, logicMode }),
  });

  return publishDrawPost(publishReq);
}

