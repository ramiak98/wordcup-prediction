import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/security";
import { recalculateAllScores } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  const auth = assertAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const recalculated = await recalculateAllScores();
    return NextResponse.json({ ok: true, recalculated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to recalculate scores.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
