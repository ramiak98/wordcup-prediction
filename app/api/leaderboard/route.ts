import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  loadActualResults,
  loadBracketPrediction,
  loadMatches,
  loadScoringRules,
  scoreRows
} from "@/lib/scoring";
import type { LeaderboardEntry, UserPredictionRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const [results, rules, matches] = await Promise.all([
      loadActualResults(),
      loadScoringRules(),
      loadMatches().catch(() => [])
    ]);

    const { data, error } = await supabase
      .from("users_predictions")
      .select("id,full_name,predictions,total_points,created_at")
      .order("total_points", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) throw error;

    const rows = (data ?? []) as UserPredictionRecord[];
    const brackets = new Map<string, Awaited<ReturnType<typeof loadBracketPrediction>>>();

    await Promise.all(
      rows.map(async (row) => {
        const bracket = await loadBracketPrediction(row.id).catch(() => null);
        brackets.set(row.id, bracket);
      })
    );

    const scored = scoreRows(rows, results, rules, brackets, matches);
    const leaderboard: LeaderboardEntry[] = scored.map((row, index) => ({
      id: row.id,
      full_name: row.full_name,
      total_points: row.score.total,
      rank: index + 1,
      created_at: row.created_at,
      breakdown: row.score
    }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load leaderboard.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
