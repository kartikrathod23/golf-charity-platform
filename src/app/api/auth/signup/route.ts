import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin";
import { AUTH_COOKIE_NAME, signAuthToken } from "@/lib/auth/jwt";
import { hashPassword } from "@/lib/auth/password";

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  // PRD: Users select a charity at signup.
  charityId: z.string().min(1),
  // PRD: Minimum contribution is 10% of the subscription fee.
  // Users may optionally increase.
  charityContributionPercent: z.number().min(10).max(100).optional(),
});

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, password, charityId, charityContributionPercent } = parsed.data;

  const supabase = getSupabaseAdmin();

  // Validate charity exists.
  const { data: charity, error: charityErr } = await supabase
    .from("charities")
    .select("id")
    .eq("id", charityId)
    .maybeSingle();

  if (charityErr || !charity) {
    return NextResponse.json(
      { error: "Invalid charityId" },
      { status: 400 },
    );
  }

  const contributionPercent = charityContributionPercent ?? 10;

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing?.id) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 },
    );
  }

  const id = randomUUID();
  const passwordHash = await hashPassword(password);

  const { error } = await supabase.from("profiles").insert({
    id,
    email,
    role: "user",
    password_hash: passwordHash,
    charity_id: charityId ?? null,
    contribution_percent: contributionPercent,
  });

  if (error) {
    return NextResponse.json(
      { error: "Signup failed" },
      { status: 500 },
    );
  }

  const token = await signAuthToken({
    userId: id,
    role: "user",
    email,
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

