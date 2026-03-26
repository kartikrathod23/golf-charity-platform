"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type Score = {
  id: string;
  scoreDate: string; // YYYY-MM-DD
  stablefordScore: number;
};

function isValidDateString(value: string): boolean {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

export default function ScoreEntry() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = useMemo(() => {
    const d = new Date();
    // local date (avoid UTC shift in simple apps)
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [scoreDate, setScoreDate] = useState(todayStr);
  const [stablefordScore, setStablefordScore] = useState<number>(18);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadScores() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scores", { credentials: "include" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload?.error ?? "Failed to load scores");
        setScores([]);
        return;
      }
      setScores(payload.scores ?? []);
    } catch {
      setError("Failed to load scores");
      setScores([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadScores();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidDateString(scoreDate)) {
      setError("Please enter a valid date (YYYY-MM-DD).");
      return;
    }
    if (!Number.isInteger(stablefordScore) || stablefordScore < 1 || stablefordScore > 45) {
      setError("Stableford score must be an integer between 1 and 45.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoreDate, stablefordScore }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload?.error ?? "Failed to save score");
        return;
      }

      // API returns latest 5; use it directly, but fall back to reload.
      if (payload?.scores) setScores(payload.scores);
      else await loadScores();
    } catch {
      setError("Failed to save score");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            Score date
          </label>
          <input
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 px-3 py-2"
            type="date"
            value={scoreDate}
            onChange={(e) => setScoreDate(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            Stableford score
          </label>
          <input
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 px-3 py-2"
            type="number"
            min={1}
            max={45}
            value={stablefordScore}
            onChange={(e) => setStablefordScore(Number(e.target.value))}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="h-11 w-full sm:w-auto rounded-xl bg-zinc-900 text-white px-5 hover:bg-zinc-800 disabled:opacity-60 transition"
        >
          {submitting ? "Saving..." : "Save score"}
        </button>
      </form>

      {error ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mt-2">
        <div className="text-sm text-zinc-600 dark:text-zinc-300">
          Latest 5 scores (most recent first)
        </div>
        {loading ? (
          <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Loading...
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {scores.length === 0 ? (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                No scores yet.
              </div>
            ) : (
              scores.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 px-4 py-3"
                >
                  <div className="text-sm">
                    <div className="font-semibold">{s.stablefordScore}</div>
                    <div className="text-zinc-500 dark:text-zinc-400 text-xs">
                      {s.scoreDate}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-sm underline hover:no-underline text-zinc-700 dark:text-zinc-200"
                    onClick={() => {
                      setScoreDate(s.scoreDate);
                      setStablefordScore(s.stablefordScore);
                    }}
                  >
                    Edit
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

