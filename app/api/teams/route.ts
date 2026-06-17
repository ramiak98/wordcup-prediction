import { NextResponse } from "next/server";
import { getTeamsSafe } from "@/lib/supabase";

export async function GET() {
  const teams = await getTeamsSafe();
  return NextResponse.json({ teams });
}
