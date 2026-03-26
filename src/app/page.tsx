import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-zinc-50 text-zinc-900 font-sans dark:bg-black dark:text-zinc-50">
      <main className="w-full max-w-5xl mx-auto px-6 py-16">
        <header className="flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 px-4 py-2 text-sm">
            Monthly subscription → Golf scores → Charity impact
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight">
            Track your golf. Win a monthly prize draw. Fund a charity you care
            about.
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            This platform is built around emotional impact, not golf clichés.
            Every subscription supports your chosen charity while you participate
            in monthly reward draws.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/charities"
              className="h-12 inline-flex items-center justify-center rounded-full bg-zinc-900 text-white px-6 transition hover:bg-zinc-800 dark:bg-white dark:text-black"
            >
              Explore Charities
            </Link>
            <Link
              href="/dashboard"
              className="h-12 inline-flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 px-6 transition hover:bg-white/70 dark:hover:bg-zinc-800/40"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/admin"
              className="h-12 inline-flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 px-6 transition hover:bg-white/70 dark:hover:bg-zinc-800/40"
            >
              Admin
            </Link>
          </div>
        </header>

        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Score Management
            </div>
            <div className="font-semibold text-xl mt-2">
              Latest 5 Stableford scores
            </div>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Enter and edit your last 5 scores. The newest scores always
              replace the oldest automatically.
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Draw Engine
            </div>
            <div className="font-semibold text-xl mt-2">
              Monthly 3/4/5-number match
            </div>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Choose random or algorithmic modes (admin-configured). Jackpot
              rolls forward if nobody hits the 5-match tier.
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Charity System
            </div>
            <div className="font-semibold text-xl mt-2">
              Automatic contributions
            </div>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Minimum 10% of your subscription supports your selected charity.
              Optional increases are tracked automatically.
            </p>
          </div>
        </section>
      </main>
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 px-6 text-sm text-zinc-600 dark:text-zinc-400">
        Built for mobile-first, responsive experience. Replace placeholders
        with real integrations (Supabase/Stripe/Resend) when you deploy.
      </footer>
    </div>
  );
}
