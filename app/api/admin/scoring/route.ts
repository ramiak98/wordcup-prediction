import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { assertAdmin } from "@/lib/security";
import { scoringRulesSchema } from "@/lib/validation";
import { loadScoringRules, recalculateAllScores } from "@/lib/scoring";

export async function GET(request: NextRequest) {
  const auth = assertAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const rules = await loadScoringRules();
    return NextResponse.json({ rules });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load scoring rules.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = assertAdmin(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = scoringRulesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check scoring rules." },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const rows = Object.entries(parsed.data).map(([rule_key, points]) => ({
      rule_key,
      points
    }));
    const { error } = await supabase
      .from("scoring_rules")
      .upsert(rows, { onConflict: "rule_key" });
    if (error) throw error;

    const recalculated = await recalculateAllScores();
    return NextResponse.json({ ok: true, recalculated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save scoring rules.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
