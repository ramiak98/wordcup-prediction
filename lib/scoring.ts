import {
  GROUP_LETTERS,
  type ActualResultsPayload,
  type PredictionPayload,
  type ScoreBreakdown,
  type ScoringRules,
  type UserPredictionRecord
} from "@/lib/types";
import { qualifiedTeamIds, defaultScoringRules } from "@/lib/world-cup";
import { getSupabaseAdmin } from "@/lib/supabase";

export function scorePrediction(
  prediction: PredictionPayload,
  results: ActualResultsPayload | null,
  rules: ScoringRules = defaultScoringRules
): ScoreBreakdown {
  if (!results) {
    return {
      total: 0,
      correctQualifiedTeams: 0,
      correctGroupWinners: 0,
      correctRunnerUps: 0,
      correctThirdPlaceQualifiers: 0,
      correctFinalists: 0,
      correctChampion: 0
    };
  }

  const actualQualified = new Set([
    ...Object.values(results.groupWinners).filter(Boolean),
    ...Object.values(results.groupRunnerUps).filter(Boolean),
    ...results.thirdPlaceQualifiers
  ]);
  const predictedQualified = qualifiedTeamIds(prediction);

  const correctQualifiedTeams = predictedQualified.filter((teamId) =>
    actualQualified.has(teamId)
  ).length;

  const correctGroupWinners = GROUP_LETTERS.filter(
    (group) =>
      prediction.groups[group]?.winner &&
      prediction.groups[group]?.winner === results.groupWinners[group]
  ).length;

  const correctRunnerUps = GROUP_LETTERS.filter(
    (group) =>
      prediction.groups[group]?.runnerUp &&
      prediction.groups[group]?.runnerUp === results.groupRunnerUps[group]
  ).length;

  const actualThird = new Set(results.thirdPlaceQualifiers);
  const correctThirdPlaceQualifiers = prediction.bestThirdPlace.filter((teamId) =>
    actualThird.has(teamId)
  ).length;

  const actualFinalists = new Set(results.finalists);
  const predictedFinalists = [
    prediction.knockout?.champion,
    prediction.knockout?.finalist
  ].filter((teamId): teamId is string => Boolean(teamId));
  const correctFinalists = predictedFinalists.filter((teamId) =>
    actualFinalists.has(teamId)
  ).length;

  const correctChampion =
    prediction.knockout?.champion && prediction.knockout.champion === results.champion
      ? 1
      : 0;

  const total =
    correctQualifiedTeams * rules.correct_qualified_team +
    correctGroupWinners * rules.correct_group_winner +
    correctRunnerUps * rules.correct_group_runner_up +
    correctThirdPlaceQualifiers * rules.correct_third_place_qualifier +
    correctFinalists * rules.correct_finalist +
    correctChampion * rules.correct_champion;

  return {
    total,
    correctQualifiedTeams,
    correctGroupWinners,
    correctRunnerUps,
    correctThirdPlaceQualifiers,
    correctFinalists,
    correctChampion
  };
}

export async function loadActualResults() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("actual_results")
    .select("results")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.results as ActualResultsPayload | null) ?? null;
}

export async function loadScoringRules(): Promise<ScoringRules> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("scoring_rules").select("*");
  if (error) throw error;

  return {
    ...defaultScoringRules,
    ...Object.fromEntries(
      (data ?? []).map((rule) => [rule.rule_key, Number(rule.points)])
    )
  };
}

export async function recalculateAllScores() {
  const supabase = getSupabaseAdmin();
  const [results, rules] = await Promise.all([
    loadActualResults(),
    loadScoringRules()
  ]);

  const { data, error } = await supabase
    .from("users_predictions")
    .select("id,predictions,total_points");
  if (error) throw error;

  const rows = (data ?? []) as Pick<
    UserPredictionRecord,
    "id" | "predictions" | "total_points"
  >[];

  await Promise.all(
    rows.map((row) => {
      const score = scorePrediction(row.predictions, results, rules);
      return supabase
        .from("users_predictions")
        .update({ total_points: score.total })
        .eq("id", row.id);
    })
  );

  return rows.length;
}

export function scoreRows(
  rows: UserPredictionRecord[],
  results: ActualResultsPayload | null,
  rules: ScoringRules
) {
  return rows.map((row) => ({
    ...row,
    score: scorePrediction(row.predictions, results, rules)
  }));
}
