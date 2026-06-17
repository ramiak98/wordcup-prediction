import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { assertAdmin } from "@/lib/security";
import { actualResultsSchema } from "@/lib/validation";
import { loadActualResults, recalculateAllScores } from "@/lib/scoring";

export async function GET(request: NextRequest) {
  const auth = assertAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const results = await loadActualResults().catch(() => null);
    return NextResponse.json({ results });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load results.";
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

  const parsed = actualResultsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the results." },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("actual_results")
      .insert({ results: parsed.data });
    if (error) throw error;

    const recalculated = await recalculateAllScores();
    return NextResponse.json({ ok: true, recalculated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save results.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
