import { NextResponse } from "next/server";
import { requireActiveSubscription } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";

const storageBucket = "winner-proofs";

export async function POST(req: Request) {
  const auth = await requireActiveSubscription();
  if (auth instanceof NextResponse) return auth;

  const form = await req.formData();
  const winnerIdRaw = form.get("winnerId");
  const proofRaw = form.get("proof");

  const winnerId = typeof winnerIdRaw === "string" ? winnerIdRaw : "";
  const proof = proofRaw;

  if (!winnerId) {
    return NextResponse.json({ error: "Missing winnerId" }, { status: 400 });
  }

  if (!(proof instanceof Blob) || proof.size === 0) {
    return NextResponse.json(
      { error: "Missing proof file" },
      { status: 400 },
    );
  }

  // Eligibility: user can submit proof only for their own draw winner row.
  const supabase = getSupabaseAdmin();
  const { data: winner, error: winnerErr } = await supabase
    .from("draw_winners")
    .select("id,profile_id,draw_id,tier")
    .eq("id", winnerId)
    .maybeSingle();

  if (winnerErr || !winner) {
    return NextResponse.json(
      { error: "Invalid winnerId" },
      { status: 404 },
    );
  }

  if (winner.profile_id !== auth.profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Blob doesn't reliably expose filenames in Node; use a stable prefix.
  const safeFileName = "proof";
  const contentType = proof.type || "application/octet-stream";

  const storagePath = `${auth.profile.id}/${winnerId}/${Date.now()}_${safeFileName}`;

  // Upload proof screenshot to Supabase Storage.
  // If the bucket doesn't exist yet, this will error (fix later via Supabase dashboard).
  const uploadResult = await supabase.storage
    .from(storageBucket)
    .upload(storagePath, proof, {
      contentType,
      upsert: true,
    });

  if (uploadResult.error) {
    return NextResponse.json(
      { error: "Proof upload failed" },
      { status: 500 },
    );
  }

  const proofStoragePath = storagePath;

  // Upsert winner_submissions and create/keep pending payout.
  const { data: existing } = await supabase
    .from("winner_submissions")
    .select("id,proof_status")
    .eq("winner_id", winnerId)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("winner_submissions")
      .update({
        proof_storage_path: proofStoragePath,
        proof_url: null,
        proof_status: "pending",
        admin_feedback: null,
        decided_at: null,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("winner_submissions").insert({
      winner_id: winnerId,
      draw_id: winner.draw_id,
      profile_id: auth.profile.id,
      proof_storage_path: proofStoragePath,
      proof_url: null,
      proof_status: "pending",
      admin_feedback: null,
      decided_at: null,
    });
  }

  const { data: payoutExisting } = await supabase
    .from("payouts")
    .select("id,status")
    .eq("winner_id", winnerId)
    .maybeSingle();

  if (!payoutExisting?.id) {
    await supabase.from("payouts").insert({
      winner_id: winnerId,
      status: "pending",
      provider_payment_id: null,
      paid_at: null,
      completed_at: null,
    });
  }

  const submission = await supabase
    .from("winner_submissions")
    .select("id")
    .eq("winner_id", winnerId)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    winnerId,
    submissionId: submission.data?.id ?? null,
  });
}

