import Link from "next/link";
import type { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50">
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="font-semibold">Golf Charity</div>
        <nav className="flex items-center gap-4 text-sm">
          <Link className="hover:underline" href="/charities">
            Charities
          </Link>
          <Link className="hover:underline" href="/admin">
            Admin
          </Link>
        </nav>
      </header>
      <main className="px-6 py-10">{children}</main>
    </div>
  );
}

