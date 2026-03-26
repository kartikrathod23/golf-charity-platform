"use client";

import { useEffect, useState } from "react";

type Charity = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  featured: boolean;
};

export default function AdminCharityManager() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [featured, setFeatured] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/charities", {
        credentials: "include",
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload?.error ?? "Failed to load charities");
        setCharities([]);
        return;
      }
      setCharities((payload?.charities ?? []) as Charity[]);
    } catch {
      setError("Failed to load charities");
      setCharities([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createCharity() {
    setError(null);
    try {
      const res = await fetch("/api/admin/charities", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          imageUrl: imageUrl || undefined,
          featured,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload?.error ?? "Charity create failed");
        return;
      }
      setName("");
      setDescription("");
      setImageUrl("");
      setFeatured(false);
      await load();
    } catch {
      setError("Charity create failed");
    }
  }

  async function deleteCharity(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/charities/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload?.error ?? "Charity delete failed");
        return;
      }
      await load();
    } catch {
      setError("Charity delete failed");
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6">
      <div className="font-semibold">Charity Management</div>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Create and maintain charities.
      </p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            Name
          </label>
          <input
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Charity name"
          />
        </div>
        <div>
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            Image URL
          </label>
          <input
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 px-3 py-2"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            Description
          </label>
          <textarea
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description"
            rows={3}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-200">
            Featured
          </span>
        </div>
        <div className="flex justify-end md:items-end">
          <button
            type="button"
            onClick={() => void createCharity()}
            className="h-11 rounded-xl bg-zinc-900 text-white px-5 hover:bg-zinc-800 transition"
          >
            Add charity
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mt-5">
        <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
          Current charities
        </div>
        {loading ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Loading...
          </div>
        ) : (
          <div className="space-y-2">
            {charities.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {c.featured ? "Featured" : "Standard"} • {c.id}
                  </div>
                </div>
                <button
                  type="button"
                  className="text-sm underline text-red-700 dark:text-red-300 hover:no-underline"
                  onClick={() => void deleteCharity(c.id)}
                >
                  Delete
                </button>
              </div>
            ))}
            {charities.length === 0 ? (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                No charities yet.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

