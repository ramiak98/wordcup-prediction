import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { assertAdmin } from "@/lib/security";
import { adminUpdateMatchSchema } from "@/lib/validation";
import { recalculateAllScores } from "@/lib/scoring";
import { setMatchWinner } from "@/lib/tournament/importer";

export async function POST(request: NextRequest) {
  const auth = assertAdmin(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = adminUpdateMatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check match result." },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    await setMatchWinner(supabase, parsed.data.match_number, parsed.data.winner_id);
    const recalculated = await recalculateAllScores();
    return NextResponse.json({ ok: true, recalculated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update match.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
