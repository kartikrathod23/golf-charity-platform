"use client";

import { useState } from "react";

export default function AdminScoreEditorPanel() {
  const [profileId, setProfileId] = useState("");
  const [scoreDate, setScoreDate] = useState("");
  const [stablefordScore, setStablefordScore] = useState<number>(18);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/scores", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          scoreDate,
          stablefordScore,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload?.error ?? "Failed to update score");
        return;
      }
      setProfileId("");
      setScoreDate("");
    } catch {
      setError("Failed to update score");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6">
      <div className="font-semibold">Admin Score Editor</div>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Update a subscriber&apos;s Stableford score (latest 5 rolling window
        is enforced).
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            Profile ID
          </label>
          <input
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 px-3 py-2"
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
            placeholder="UUID"
          />
        </div>
        <div>
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            Score date (YYYY-MM-DD)
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
            Stableford score (1–45)
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
          type="button"
          disabled={loading}
          onClick={() => void submit()}
          className="h-11 w-full rounded-xl bg-zinc-900 text-white px-5 hover:bg-zinc-800 disabled:opacity-60 transition"
        >
          {loading ? "Saving..." : "Save score"}
        </button>
        {error ? (
          <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
        ) : null}
      </div>
    </section>
  );
}

