"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function doLogout() {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      router.push("/");
    }

    void doLogout();
  }, [router]);

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 text-center">
      <p className="text-lg">Signing out...</p>
    </div>
  );
}
