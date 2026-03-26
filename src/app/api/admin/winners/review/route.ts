import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";
import { sendEmail } from "@/lib/email/sendEmail";

const BodySchema = z.object({
  submissionId: z.string().min(1),
  decision: z.enum(["approved", "rejected"]),
  adminFeedback: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  void auth;

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { submissionId, decision, adminFeedback } = parsed.data;

  const supabase = getSupabaseAdmin();

  const { data: submission, error: submissionErr } = await supabase
    .from("winner_submissions")
    .select("id,winner_id,proof_status,profile_id")
    .eq("id", submissionId)
    .maybeSingle();

  if (submissionErr || !submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const decidedAt = new Date().toISOString();

  await supabase
    .from("winner_submissions")
    .update({
      proof_status: decision,
      admin_feedback: adminFeedback ?? null,
      decided_at: decidedAt,
    })
    .eq("id", submission.id);

  if (decision === "approved") {
    const { data: payoutExisting } = await supabase
      .from("payouts")
      .select("id,status")
      .eq("winner_id", submission.winner_id)
      .maybeSingle();

    if (payoutExisting?.id) {
      if (payoutExisting.status !== "paid") {
        await supabase
          .from("payouts")
          .update({
            status: "paid",
            paid_at: decidedAt,
          })
          .eq("id", payoutExisting.id);
      }
    } else {
      await supabase.from("payouts").insert({
        winner_id: submission.winner_id,
        status: "paid",
        provider_payment_id: null,
        created_at: decidedAt,
        paid_at: decidedAt,
        completed_at: null,
      });
    }
  }

  // Best-effort winner notification.
  try {
    const { data: winnerProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", submission.profile_id)
      .maybeSingle();

    const to = winnerProfile?.email;
    if (to) {
      const subject =
        decision === "approved"
          ? "Your winner proof was approved"
          : "Your winner proof was rejected";
      const text = [
        "Hi!",
        "",
        decision === "approved"
          ? "Good news: your winner proof was approved."
          : "Thanks for submitting your winner proof. Unfortunately, it was rejected.",
        "",
        adminFeedback ? `Admin notes: ${adminFeedback}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      await sendEmail({ to, subject, text }).catch(() => undefined);
    }
  } catch {
    // Do not fail the admin action due to email issues.
  }

  return NextResponse.json({ ok: true });
}

