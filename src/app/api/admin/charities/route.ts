import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";

const BodySchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  imageUrl: z.string().url().optional(),
  featured: z.boolean().optional(),
});

export async function GET() {
  const res = await requireAdmin();
  if (res instanceof NextResponse) return res;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("charities")
    .select("id,name,description,image_url,featured")
    .order("featured", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to load charities" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, charities: data ?? [] });
}

export async function POST(req: Request) {
  const res = await requireAdmin();
  if (res instanceof NextResponse) return res;

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, description, imageUrl, featured } = parsed.data;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("charities").insert({
    name,
    description: description ?? null,
    image_url: imageUrl ?? null,
    featured: featured ?? false,
  });

  if (error) {
    return NextResponse.json({ error: "Charity create failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

