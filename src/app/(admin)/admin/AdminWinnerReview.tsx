"use client";

import { useEffect, useState } from "react";

type PendingSubmission = {
  id: string;
  winnerId: string;
  drawId: string;
  profileId: string;
  tier: number | null;
  proofStatus: string;
  createdAt: string;
  adminFeedback: string | null;
};

export default function AdminWinnerReview() {
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/winner-submissions", {
        credentials: "include",
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload?.error ?? "Failed to load submissions");
        setSubmissions([]);
        return;
      }
      setSubmissions(payload?.submissions ?? []);
    } catch {
      setError("Failed to load submissions");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function decide(submissionId: string, decision: "approved" | "rejected") {
    setError(null);
    const feedback =
      window.prompt(
        decision === "approved"
          ? "Admin feedback (optional):"
          : "Rejection reason (optional):",
      ) ?? undefined;

    try {
      const res = await fetch("/api/admin/winners/review", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          decision,
          adminFeedback: feedback,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload?.error ?? "Decision failed");
        return;
      }
      await load();
    } catch {
      setError("Decision failed");
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6">
      <div className="font-semibold">Winner Verification</div>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Review pending winner proof submissions.
      </p>

      {loading ? (
        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Loading...
        </div>
      ) : error ? (
        <div className="mt-4 text-sm text-red-700 dark:text-red-300">{error}</div>
      ) : submissions.length === 0 ? (
        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          No pending submissions.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {submissions.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4"
            >
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Submission ID: <span className="font-semibold">{s.id}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                <div>
                  Winner: <span className="font-semibold">{s.winnerId}</span>
                </div>
                <div>
                  Draw: <span className="font-semibold">{s.drawId}</span>
                </div>
                <div>
                  Tier: <span className="font-semibold">{s.tier ?? "—"}</span>
                </div>
                <div>
                  Proof status:{" "}
                  <span className="font-semibold">{s.proofStatus}</span>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="h-10 flex-1 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition"
                  onClick={() => void decide(s.id, "approved")}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="h-10 flex-1 rounded-xl border border-red-300 bg-white dark:bg-zinc-900/40 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950 transition"
                  onClick={() => void decide(s.id, "rejected")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

