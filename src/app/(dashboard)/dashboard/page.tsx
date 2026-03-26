import ScoreEntry from "./ScoreEntry";
import DashboardSummary from "./DashboardSummary";

export default function DashboardPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Subscriber Dashboard</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Enter your latest Stableford scores (1–45). Only your latest 5
        scores are kept.
      </p>

      <div className="mt-6">
        <DashboardSummary />
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6">
        <div className="font-semibold">Score Entry</div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Add a score for a specific date. Submitting a score with the same
          date will edit it.
        </p>

        <div className="mt-6">
          <ScoreEntry />
        </div>
      </div>
    </div>
  );
}

