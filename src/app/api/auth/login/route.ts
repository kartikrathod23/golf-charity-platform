import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";
import { AUTH_COOKIE_NAME, signAuthToken } from "@/lib/auth/jwt";
import { verifyPassword } from "@/lib/auth/password";

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  const supabase = getSupabaseAdmin();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,email,role,password_hash")
    .eq("email", email)
    .maybeSingle();

  if (error || !profile || !profile.password_hash) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

  const ok = await verifyPassword(password, profile.password_hash);
  if (!ok) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

  const token = await signAuthToken({
    userId: profile.id,
    role: profile.role,
    email: profile.email,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return res;
}

