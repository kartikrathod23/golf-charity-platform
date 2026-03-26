import { NextResponse } from "next/server";
import { listCharities } from "@/lib/db/repositories/charities";

export async function GET() {
  const charities = await listCharities();
  return NextResponse.json({ ok: true, charities });
}

