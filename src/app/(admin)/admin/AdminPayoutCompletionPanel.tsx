"use client";

import { useEffect, useState } from "react";

type PendingPayout = {
  id: string;
  winnerId: string;
  tier: number | null;
  profileId: string | null;
  drawId: string | null;
  prizeAmountCents: number;
  paidAt: string | null;
};

export default function AdminPayoutCompletionPanel() {
  const [payouts, setPayouts] = useState<PendingPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payouts/pending", {
        credentials: "include",
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload?.error ?? "Failed to load payouts");
        setPayouts([]);
        return;
      }
      setPayouts(payload?.payouts ?? []);
    } catch {
      setError("Failed to load payouts");
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function complete(payoutId: string) {
    setError(null);
    try {
      const res = await fetch("/api/admin/payouts/complete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload?.error ?? "Failed to complete payout");
        return;
      }
      await load();
    } catch {
      setError("Failed to complete payout");
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6">
      <div className="font-semibold">Payout Completion</div>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Mark paid payouts as completed.
      </p>

      {loading ? (
        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Loading...
        </div>
      ) : error ? (
        <div className="mt-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : payouts.length === 0 ? (
        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          No payouts ready for completion.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {payouts.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4"
            >
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Payout ID: <span className="font-semibold">{p.id}</span>
              </div>
              <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                Tier: <span className="font-semibold">{p.tier ?? "—"}</span> •
                Amount:{" "}
                <span className="font-semibold">
                  {(p.prizeAmountCents / 100).toFixed(2)}
                </span>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  className="h-10 rounded-xl bg-zinc-900 text-white px-4 hover:bg-zinc-800 transition"
                  onClick={() => void complete(p.id)}
                >
                  Mark Completed
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

