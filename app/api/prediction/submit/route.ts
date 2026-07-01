import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isBracketComplete, missingBracketPicks } from "@/lib/bracket";
import { bracketSubmitSchema } from "@/lib/validation";
import { loadBracketPrediction } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bracketSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check your submission." },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { prediction_id } = parsed.data;

    const { data: predictionRow, error: predictionError } = await supabase
      .from("users_predictions")
      .select("id")
      .eq("id", prediction_id)
      .single();

    if (predictionError || !predictionRow) {
      return NextResponse.json({ error: "Prediction not found." }, { status: 404 });
    }

    const bracket = await loadBracketPrediction(prediction_id);
    if (!bracket) {
      return NextResponse.json(
        { error: "Complete your bracket picks before submitting." },
        { status: 400 }
      );
    }

    if (bracket.submitted_at) {
      return NextResponse.json({
        ok: true,
        submitted_at: bracket.submitted_at,
        already_submitted: true
      });
    }

    if (!isBracketComplete(bracket)) {
      const missing = missingBracketPicks(bracket);
      return NextResponse.json(
        {
          error: `Complete all knockout picks before submitting. Missing ${missing.length} match(es).`,
          missing_matches: missing
        },
        { status: 400 }
      );
    }

    const submittedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("bracket_predictions")
      .update({ submitted_at: submittedAt })
      .eq("prediction_id", prediction_id);

    if (updateError) throw updateError;

    return NextResponse.json({
      ok: true,
      submitted_at: submittedAt,
      champion: bracket.champion
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to submit bracket.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
