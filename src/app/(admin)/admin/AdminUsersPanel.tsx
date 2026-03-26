"use client";

import { useEffect, useState } from "react";

type AdminUser = {
  id: string;
  email: string;
  role: string;
  charityId: string | null;
  contributionPercent: number | null;
  subscription: {
    status: string;
    renewalDate: string | null;
    planType: string | null;
  } | null;
};

export default function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/users", {
          credentials: "include",
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(payload?.error ?? "Failed to load users");
          setUsers([]);
          return;
        }
        setUsers(payload?.users ?? []);
      } catch {
        setError("Failed to load users");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6">
      <div className="font-semibold">Users</div>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        View subscribers and admins (including latest subscription status).
      </p>

      {loading ? (
        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Loading...
        </div>
      ) : error ? (
        <div className="mt-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          No users found.
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {users.slice(0, 30).map((u) => (
            <div
              key={u.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4"
            >
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {u.email} • <span className="font-semibold">{u.role}</span>
              </div>
              <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                Subscription:{" "}
                <span className="font-semibold">
                  {u.subscription?.status ?? "—"}
                </span>{" "}
                {u.subscription?.renewalDate ? (
                  <span className="text-zinc-500 dark:text-zinc-400">
                    (renewal {u.subscription.renewalDate})
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

