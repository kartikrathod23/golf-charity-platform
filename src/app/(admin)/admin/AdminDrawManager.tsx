"use client";

import { useEffect, useMemo, useState } from "react";

type DrawSimPayload = {
  ok: true;
  monthStart: string;
  logicMode: string;
  drawnNumbers: number[];
  winners: { 3: string[]; 4: string[]; 5: string[] };
  prizePool: {
    totalCents: number;
    prizePool5Cents: number;
    prizePool4Cents: number;
    prizePool3Cents: number;
  };
  rolloverToNextCents: number;
};

export default function AdminDrawManager() {
  const defaultMonthStart = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}-01`;
  }, []);

  const [monthStart, setMonthStart] = useState(defaultMonthStart);
  const [logicMode, setLogicMode] = useState<"random" | "algorithmic">("random");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<DrawSimPayload | null>(null);

  async function runSimulate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/draws/simulate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthStart, logicMode }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload?.error ?? "Simulation failed");
        setSimulation(null);
        return;
      }
      setSimulation(payload as DrawSimPayload);
    } catch {
      setError("Simulation failed");
      setSimulation(null);
    } finally {
      setLoading(false);
    }
  }

  async function publish() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/draws/publish", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthStart, logicMode }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload?.error ?? "Publish failed");
        return;
      }
      setSimulation(payload as DrawSimPayload);
    } catch {
      setError("Publish failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void runSimulate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6">
      <div className="font-semibold">Draw Engine</div>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Simulate and publish monthly draws (3/4/5-number tiers).
      </p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            Month start
          </label>
          <input
            type="month"
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 px-3 py-2"
            value={monthStart.slice(0, 7)}
            onChange={(e) => {
              const v = e.target.value; // YYYY-MM
              setMonthStart(`${v}-01`);
            }}
          />
        </div>
        <div>
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            Logic mode
          </label>
          <select
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 px-3 py-2"
            value={logicMode}
            onChange={(e) =>
              setLogicMode(e.target.value as "random" | "algorithmic")
            }
          >
            <option value="random">Random</option>
            <option value="algorithmic">Algorithmic</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="h-11 flex-1 rounded-xl bg-zinc-900 text-white px-4 hover:bg-zinc-800 disabled:opacity-60 transition"
            disabled={loading}
            onClick={() => void runSimulate()}
          >
            Simulate
          </button>
          <button
            type="button"
            className="h-11 flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 px-4 hover:bg-white/70 dark:hover:bg-zinc-900/60 disabled:opacity-60 transition"
            disabled={loading}
            onClick={() => void publish()}
          >
            Publish
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {simulation ? (
        <div className="mt-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Drawn numbers
          </div>
          <div className="mt-1 font-semibold">
            {simulation.drawnNumbers.join(", ")}
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">5-match</div>
              <div className="font-semibold">{simulation.winners[5].length} winners</div>
            </div>
            <div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">4-match</div>
              <div className="font-semibold">{simulation.winners[4].length} winners</div>
            </div>
            <div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">3-match</div>
              <div className="font-semibold">{simulation.winners[3].length} winners</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Prize pool total: {(simulation.prizePool.totalCents / 100).toFixed(2)}
          </div>
        </div>
      ) : null}
    </section>
  );
}

