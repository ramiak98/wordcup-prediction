import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createPredictionSchema } from "@/lib/validation";
import { getRequestIp, hashIp, hashUserAgent, createFallbackToken } from "@/lib/security";
import { loadActualResults, loadScoringRules, scorePrediction } from "@/lib/scoring";
import { defaultScoringRules } from "@/lib/world-cup";
import type { PredictionPayload } from "@/lib/types";

async function safeInitialScore(predictions: unknown) {
  try {
    const [results, rules] = await Promise.all([
      loadActualResults(),
      loadScoringRules().catch(() => defaultScoringRules)
    ]);
    return scorePrediction(predictions as PredictionPayload, results, rules).total;
  } catch {
    return 0;
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = createPredictionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check your prediction." },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const voteToken = parsed.data.vote_token || createFallbackToken();
    const ipHash = hashIp(getRequestIp(request));
    const userAgentHash = hashUserAgent(request.headers.get("user-agent"));

    const duplicateExpression = `vote_token.eq.${voteToken},and(ip_hash.eq.${ipHash},user_agent_hash.eq.${userAgentHash})`;
    const { data: existing, error: duplicateError } = await supabase
      .from("users_predictions")
      .select("id")
      .or(duplicateExpression)
      .limit(1);

    if (duplicateError) throw duplicateError;

    if (existing?.length) {
      return NextResponse.json(
        {
          error:
            "A prediction has already been submitted from this browser or device.",
          predictionId: existing[0].id
        },
        { status: 409 }
      );
    }

    const totalPoints = await safeInitialScore(parsed.data.predictions);
    const { data, error } = await supabase
      .from("users_predictions")
      .insert({
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        vote_token: voteToken,
        ip_hash: ipHash,
        user_agent_hash: userAgentHash,
        predictions: parsed.data.predictions,
        total_points: totalPoints
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id, vote_token: voteToken });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to submit prediction.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
