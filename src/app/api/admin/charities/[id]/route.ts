import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";

const BodySchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional(),
  imageUrl: z.string().url().optional(),
  featured: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const res = await requireAdmin();
  if (res instanceof NextResponse) return res;

  const { id } = await params;

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();

  const patch = {
    ...(parsed.data.name ? { name: parsed.data.name } : {}),
    ...(parsed.data.description !== undefined
      ? { description: parsed.data.description ?? null }
      : {}),
    ...(parsed.data.imageUrl !== undefined
      ? { image_url: parsed.data.imageUrl ?? null }
      : {}),
    ...(parsed.data.featured !== undefined ? { featured: parsed.data.featured } : {}),
  };

  const { error } = await supabase
    .from("charities")
    .update(patch)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Charity update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const res = await requireAdmin();
  if (res instanceof NextResponse) return res;

  const { id } = await params;

  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("charities").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Charity delete failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

