import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";

export async function POST() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  // TODO (milestone 6): execute monthly draw (eligibility generation).
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 },
  );
}

