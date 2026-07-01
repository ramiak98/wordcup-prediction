import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { applyBracketPick, emptyBracketPredictions } from "@/lib/bracket";
import { bracketPickSchema } from "@/lib/validation";
import {
  loadActualResults,
  loadBracketPrediction,
  loadMatches,
  loadScoringRules,
  recalculateAllScores,
  scorePrediction
} from "@/lib/scoring";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bracketPickSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check your pick." },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { prediction_id, match_number, winner_id } = parsed.data;

    const { data: predictionRow, error: predictionError } = await supabase
      .from("users_predictions")
      .select("id,predictions")
      .eq("id", prediction_id)
      .single();

    if (predictionError || !predictionRow) {
      return NextResponse.json({ error: "Prediction not found." }, { status: 404 });
    }

    const [matches, existing] = await Promise.all([
      loadMatches(),
      loadBracketPrediction(prediction_id)
    ]);

    const match = matches.find((entry) => entry.match_number === match_number);
    if (!match) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    const current = existing ?? emptyBracketPredictions(prediction_id);
    const updated = applyBracketPick(match, matches, current, winner_id);

    const { error: upsertError } = await supabase.from("bracket_predictions").upsert(
      {
        prediction_id,
        round32: updated.round32,
        round16: updated.round16,
        quarter_finals: updated.quarter_finals,
        semi_finals: updated.semi_finals,
        final: updated.final,
        third_place: updated.third_place,
        champion: updated.champion
      },
      { onConflict: "prediction_id" }
    );

    if (upsertError) throw upsertError;

    const [results, rules] = await Promise.all([
      loadActualResults(),
      loadScoringRules()
    ]);
    const score = scorePrediction(
      predictionRow.predictions,
      results,
      rules,
      updated,
      matches
    );

    await supabase
      .from("users_predictions")
      .update({ total_points: score.total })
      .eq("id", prediction_id);

    return NextResponse.json({ ok: true, predictions: updated, score });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save prediction.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
