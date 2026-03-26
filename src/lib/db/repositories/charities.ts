import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";
import type { Charity } from "@/lib/db/types";

export async function listCharities(): Promise<Charity[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("charities")
    .select("id,name,description,image_url,featured")
    .order("featured", { ascending: false });

  if (error || !data) return [];

  type CharityRow = {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    featured: boolean;
  };

  const rows = data as CharityRow[];
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description ?? null,
    imageUrl: c.image_url ?? null,
    featured: Boolean(c.featured),
  }));
}

export async function getCharityById(charityId: string): Promise<Charity | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("charities")
    .select("id,name,description,image_url,featured")
    .eq("id", charityId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    description: data.description ?? null,
    imageUrl: data.image_url ?? null,
    featured: Boolean(data.featured),
  };
}

