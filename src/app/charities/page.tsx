import Link from "next/link";

import { listCharities } from "@/lib/db/repositories/charities";

export const dynamic = "force-dynamic";

export default async function CharitiesPage() {
  const charities = await listCharities();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold">Charities</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Pick a charity to support with your subscription contributions.
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {charities.map((c) => (
          <Link
            key={c.id}
            href={`/charities/${c.id}`}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 hover:bg-white/70 dark:hover:bg-zinc-900/60 transition"
          >
            <div className="font-semibold">{c.name}</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              View profile
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

