"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AuthStatus = {
  profile: { id: string; email: string; role: string; charityId: string | null; contributionPercent: number | null };
  subscription?: { status?: string | null; renewal_date?: string | null } | null;
};

export default function TopNav() {
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          setAuth(null);
          return;
        }
        const data = await res.json();
        setAuth(data as AuthStatus);
      } catch {
        setAuth(null);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setAuth(null);
    router.push("/");
  }

  const navClass = (path: string) =>
    `px-3 py-1 rounded-md transition ${pathname === path ? "bg-zinc-900 text-white" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"}`;

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 sticky top-0 z-20 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-bold text-lg text-zinc-900 dark:text-white">Golf Charity</Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/charities" className={navClass("/charities")}>
              Charities
            </Link>
            <Link href="/dashboard" className={navClass("/dashboard")}>
              Dashboard
            </Link>
            <Link href="/admin" className={navClass("/admin")}>
              Admin
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-sm text-zinc-500">Loading...</span>
          ) : auth?.profile ? (
            <>
              <span className="hidden sm:inline text-sm text-zinc-700 dark:text-zinc-300">
                {auth.profile.email} • {auth.profile.role}
              </span>
              <button onClick={logout} className="text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white">
                Login
              </Link>
              <Link href="/auth/signup" className="text-sm border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                Signup
              </Link>
            </>
          )}
          {error ? <div className="text-xs text-red-600">{error}</div> : null}
        </div>
      </div>
    </header>
  );
}
