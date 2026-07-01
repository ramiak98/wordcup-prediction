import { NextRequest, NextResponse } from "next/server";
import { getTeamsSafe } from "@/lib/supabase";
import { buildUserBracket, emptyBracketPredictions } from "@/lib/bracket";
import { loadBracketPrediction, loadMatches } from "@/lib/scoring";
import type { BracketPredictions } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const predictionId = request.nextUrl.searchParams.get("prediction_id");

  try {
    const [matches, teams] = await Promise.all([loadMatches(), getTeamsSafe()]);

    let predictions: BracketPredictions | null = predictionId
      ? await loadBracketPrediction(predictionId)
      : null;

    if (predictionId && !predictions) {
      predictions = emptyBracketPredictions(predictionId);
    }

    const bracket = predictions
      ? buildUserBracket(matches, predictions)
      : matches.map((match) => ({
          ...match,
          team_a_resolved: match.team_a,
          team_b_resolved: match.team_b
        }));

    return NextResponse.json({
      matches: bracket,
      predictions,
      teams
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load bracket.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
