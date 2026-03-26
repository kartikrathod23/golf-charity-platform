"use client";

import { useEffect, useState } from "react";

type DashboardSummaryPayload = {
  ok: true;
  profile: { charityId: string | null; contributionPercent: number | null };
  subscription: {
    status: string;
    renewalDate: string | null;
    planType: string | null;
  } | null;
  participation: { drawsEntered: number; upcomingDraws: number };
  winnings: { totalWonCents: number; paymentStatus: string };
};

export default function DashboardSummary() {
  const [payload, setPayload] = useState<DashboardSummaryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/dashboard/summary", {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error ?? "Failed to load dashboard summary");
          setPayload(null);
          return;
        }
        setPayload(data as DashboardSummaryPayload);
      } catch {
        setError("Failed to load dashboard summary");
        setPayload(null);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6">
        <div className="font-semibold">Subscription</div>
        {loading ? (
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Loading...
          </div>
        ) : error ? (
          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        ) : payload?.subscription ? (
          <div className="mt-3 text-sm text-zinc-700 dark:text-zinc-200 space-y-1">
            <div>
              Status:{" "}
              <span className="font-semibold">{payload.subscription.status}</span>
            </div>
            <div>
              Renewal:{" "}
              <span className="font-semibold">
                {payload.subscription.renewalDate ?? "—"}
              </span>
            </div>
            <div>
              Plan:{" "}
              <span className="font-semibold">{payload.subscription.planType ?? "—"}</span>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            No subscription found.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6">
        <div className="font-semibold">Charity & Participation</div>
        {loading ? (
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Loading...
          </div>
        ) : error ? (
          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        ) : payload ? (
          <div className="mt-3 text-sm text-zinc-700 dark:text-zinc-200 space-y-2">
            <div>
              Charity: <span className="font-semibold">{payload.profile.charityId ?? "—"}</span>
            </div>
            <div>
              Contribution:{" "}
              <span className="font-semibold">
                {payload.profile.contributionPercent ?? 10}%
              </span>
            </div>
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              Draws entered: <span className="font-semibold">{payload.participation.drawsEntered}</span>
            </div>
            <div>
              Upcoming draws: <span className="font-semibold">{payload.participation.upcomingDraws}</span>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            —{/* placeholder */}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 lg:col-span-2">
        <div className="font-semibold">Winnings</div>
        {loading ? (
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Loading...
          </div>
        ) : error ? (
          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        ) : payload ? (
          <div className="mt-3 text-sm text-zinc-700 dark:text-zinc-200 space-y-2">
            <div>
              Total won:{" "}
              <span className="font-semibold">
                {(payload.winnings.totalWonCents / 100).toFixed(2)}
              </span>
            </div>
            <div>
              Payment status:{" "}
              <span className="font-semibold">{payload.winnings.paymentStatus}</span>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            No winnings yet.
          </div>
        )}
      </div>
    </div>
  );
}

