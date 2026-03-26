import { notFound } from "next/navigation";
import { getCharityById } from "@/lib/db/repositories/charities";

export const dynamic = "force-dynamic";

export default async function CharityProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const charity = await getCharityById(params.id);
  if (!charity) return notFound();

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">{charity.name}</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        {charity.description}
      </p>

      <div className="mt-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6">
        <div className="font-semibold">Subscribe with this charity</div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Placeholder CTA. Next: integrate signup flow and store the selected
          charity + contribution %.
        </p>
      </div>
    </div>
  );
}

