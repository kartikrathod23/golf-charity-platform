"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? "Login failed");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Could not reach login endpoint. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6">
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Enter your credentials to access your dashboard and subscription tools.
      </p>

      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm text-zinc-600 dark:text-zinc-300">Email</label>
          <input
            type="email"
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-600 dark:text-zinc-300">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-zinc-900 text-white px-4 py-2 hover:bg-zinc-800 disabled:opacity-60"
        >
          {submitting ? "Logging in..." : "Login"}
        </button>

        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          New here? <a href="/auth/signup" className="text-blue-600">Create an account</a>
        </div>
      </form>
    </div>
  );
}
