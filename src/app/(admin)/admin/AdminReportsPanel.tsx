"use client";

import { useEffect, useState } from "react";

type AdminReportsPayload = {
  ok: true;
  stats: {
    totalUsers: number;
    activeSubscriptions: number;
    totalPrizePoolCents: number;
    totalCharityContribCents: number;
  };
};

export default function AdminReportsPanel() {
  const [payload, setPayload] = useState<AdminReportsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/reports", {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error ?? "Failed to load reports");
          setPayload(null);
          return;
        }
        setPayload(data as AdminReportsPayload);
      } catch {
        setError("Failed to load reports");
        setPayload(null);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6">
      <div className="font-semibold">Reports & Analytics</div>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Snapshot of platform KPIs.
      </p>

      {loading ? (
        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Loading...
        </div>
      ) : error ? (
        <div className="mt-4 text-sm text-red-700 dark:text-red-300">{error}</div>
      ) : payload ? (
        <div className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
          <div>
            Total users: <span className="font-semibold">{payload.stats.totalUsers}</span>
          </div>
          <div>
            Active subscriptions:{" "}
            <span className="font-semibold">{payload.stats.activeSubscriptions}</span>
          </div>
          <div>
            Total prize pool:{" "}
            <span className="font-semibold">
              {(payload.stats.totalPrizePoolCents / 100).toFixed(2)}
            </span>
          </div>
          <div>
            Charity contributions:{" "}
            <span className="font-semibold">
              {(payload.stats.totalCharityContribCents / 100).toFixed(2)}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          No report data.
        </div>
      )}
    </section>
  );
}

