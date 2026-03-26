"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CharityItem = { id: string; name: string; featured?: boolean };

export default function SignupPage() {
  const router = useRouter();
  const [charities, setCharities] = useState<CharityItem[]>([]);
  const [loadingCharities, setLoadingCharities] = useState(true);
  const [charityId, setCharityId] = useState("");
  const [charityError, setCharityError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contributionPercent, setContributionPercent] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCharities() {
      setLoadingCharities(true);
      setCharityError(null);
      try {
        const res = await fetch("/api/charities");
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setCharityError(err?.error ?? "Failed to load charities.");
          return;
        }
        const data = await res.json();
        const list = data.charities ?? [];
        setCharities(list);
        setCharityId(list[0]?.id ?? "");
      } catch {
        setCharityError("Failed to load charities.");
      } finally {
        setLoadingCharities(false);
      }
    }
    void fetchCharities();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email || !password || (!charityId && charities.length > 0)) {
      setError("Please fill all fields.");
      return;
    }

    if (charities.length === 0) {
      setError("Signup requires at least one charity. Please create a charity first.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (contributionPercent < 10 || contributionPercent > 100) {
      setError("Contribution percent must be between 10 and 100.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, charityId, charityContributionPercent: contributionPercent }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload?.error ?? "Failed to create account");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Signup failed: network or server error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Join and start tracking scores with charity support.
      </p>

      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm text-zinc-600 dark:text-zinc-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-600 dark:text-zinc-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 px-3 py-2"
            required
            minLength={8}
          />
          <p className="text-xs text-zinc-500">8+ characters.</p>
        </div>

        <div>
          <label className="block text-sm text-zinc-600 dark:text-zinc-300">Charity</label>
          <select
            value={charityId}
            onChange={(e) => setCharityId(e.target.value)}
            disabled={loadingCharities || charities.length === 0}
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 px-3 py-2"
          >
            {loadingCharities ? (
              <option>Loading charities...</option>
            ) : charities.length === 0 ? (
              <option value="">No charities available</option>
            ) : (
              charities.map((charity) => (
                <option key={charity.id} value={charity.id}>
                  {charity.name}
                </option>
              ))
            )}
          </select>
          {charityError ? <p className="text-xs text-red-600 mt-1">{charityError}</p> : null}
          {charities.length === 0 && !loadingCharities ? (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              No charities exist yet. Please add one in Admin (or run the SQL seed) before signing up.
            </p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm text-zinc-600 dark:text-zinc-300">Contribution %</label>
          <input
            type="number"
            value={contributionPercent}
            onChange={(e) => setContributionPercent(Number(e.target.value))}
            min={10}
            max={100}
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 px-3 py-2"
          />
          <p className="text-xs text-zinc-500">Minimum 10% is required.</p>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting || loadingCharities}
          className="w-full rounded-xl bg-zinc-900 text-white px-4 py-2 hover:bg-zinc-800 disabled:opacity-60"
        >
          {submitting ? "Signing up..." : "Create account"}
        </button>

        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Already registered? <a href="/auth/login" className="text-blue-600">Login</a>
        </div>
      </form>
    </div>
  );
}
