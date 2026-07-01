import {
  GROUP_LETTERS,
  type ActualResultsPayload,
  type BracketPredictions,
  type MatchRecord,
  type MatchRound,
  type PredictionPayload,
  type ScoreBreakdown,
  type ScoringRules,
  type UserPredictionRecord
} from "@/lib/types";
import { qualifiedTeamIds, defaultScoringRules } from "@/lib/world-cup";
import { getSupabaseAdmin } from "@/lib/supabase";

function countKnockoutCorrect(
  bracket: BracketPredictions | null,
  matches: MatchRecord[],
  round: MatchRound,
  picks: Record<string, string>
) {
  const roundMatches = matches.filter((match) => match.round === round && match.winner);
  return roundMatches.filter((match) => picks[String(match.match_number)] === match.winner).length;
}

export function scorePrediction(
  prediction: PredictionPayload,
  results: ActualResultsPayload | null,
  rules: ScoringRules = defaultScoringRules,
  bracket: BracketPredictions | null = null,
  matches: MatchRecord[] = []
): ScoreBreakdown {
  const empty: ScoreBreakdown = {
    total: 0,
    correctQualifiedTeams: 0,
    correctGroupWinners: 0,
    correctRunnerUps: 0,
    correctThirdPlaceQualifiers: 0,
    correctRoundOf32: 0,
    correctRoundOf16: 0,
    correctQuarterFinals: 0,
    correctSemiFinals: 0,
    correctFinal: 0,
    correctThirdPlace: 0,
    correctFinalists: 0,
    correctChampion: 0
  };

  if (!results) return empty;

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

  let correctRoundOf32 = 0;
  let correctRoundOf16 = 0;
  let correctQuarterFinals = 0;
  let correctSemiFinals = 0;
  let correctFinal = 0;
  let correctThirdPlace = 0;

  if (bracket && matches.length) {
    correctRoundOf32 = countKnockoutCorrect(bracket, matches, "round-of-32", bracket.round32);
    correctRoundOf16 = countKnockoutCorrect(bracket, matches, "round-of-16", bracket.round16);
    correctQuarterFinals = countKnockoutCorrect(
      bracket,
      matches,
      "quarter-finals",
      bracket.quarter_finals
    );
    correctSemiFinals = countKnockoutCorrect(bracket, matches, "semi-finals", bracket.semi_finals);
    correctFinal = countKnockoutCorrect(bracket, matches, "final", bracket.final);
    correctThirdPlace = countKnockoutCorrect(bracket, matches, "third-place", bracket.third_place);
  }

  const finalMatch = matches.find((match) => match.match_number === 104);
  const semiMatches = matches.filter((match) => match.round === "semi-finals" && match.winner);
  const actualFinalists = new Set(
    [
      ...semiMatches.map((match) => match.winner),
      finalMatch?.winner,
      finalMatch?.team_a,
      finalMatch?.team_b
    ].filter(Boolean) as string[]
  );

  const predictedFinalist = bracket?.champion
    ? [bracket.champion, bracket.final[ "104" ]].filter(Boolean)
    : [
        prediction.knockout?.champion,
        prediction.knockout?.finalist
      ].filter((teamId): teamId is string => Boolean(teamId));

  const correctFinalists = predictedFinalist.filter((teamId) => actualFinalists.has(teamId)).length;

  const actualChampion = finalMatch?.winner ?? results.champion;
  const predictedChampion = bracket?.champion ?? prediction.knockout?.champion;
  const correctChampion =
    predictedChampion && predictedChampion === actualChampion ? 1 : 0;

  const total =
    correctQualifiedTeams * rules.correct_qualified_team +
    correctGroupWinners * rules.correct_group_winner +
    correctRunnerUps * rules.correct_group_runner_up +
    correctThirdPlaceQualifiers * rules.correct_third_place_qualifier +
    correctRoundOf32 * rules.correct_round_of_32 +
    correctRoundOf16 * rules.correct_round_of_16 +
    correctQuarterFinals * rules.correct_quarter_final +
    correctSemiFinals * rules.correct_semi_final +
    correctThirdPlace * rules.correct_third_place +
    correctFinal * rules.correct_final +
    correctFinalists * rules.correct_finalist +
    correctChampion * rules.correct_champion;

  return {
    total,
    correctQualifiedTeams,
    correctGroupWinners,
    correctRunnerUps,
    correctThirdPlaceQualifiers,
    correctRoundOf32,
    correctRoundOf16,
    correctQuarterFinals,
    correctSemiFinals,
    correctFinal,
    correctThirdPlace,
    correctFinalists,
    correctChampion
  };
}

export async function loadMatches(): Promise<MatchRecord[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("match_number", { ascending: true });

  if (error) throw error;
  return (data ?? []) as MatchRecord[];
}

export async function loadBracketPrediction(predictionId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bracket_predictions")
    .select("*")
    .eq("prediction_id", predictionId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    prediction_id: data.prediction_id,
    round32: (data.round32 ?? {}) as Record<string, string>,
    round16: (data.round16 ?? {}) as Record<string, string>,
    quarter_finals: (data.quarter_finals ?? {}) as Record<string, string>,
    semi_finals: (data.semi_finals ?? {}) as Record<string, string>,
    final: (data.final ?? {}) as Record<string, string>,
    third_place: (data.third_place ?? {}) as Record<string, string>,
    champion: data.champion as string | null,
    updated_at: data.updated_at
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
  } as ScoringRules;
}

export async function recalculateAllScores() {
  const supabase = getSupabaseAdmin();
  const [results, rules, matches] = await Promise.all([
    loadActualResults(),
    loadScoringRules(),
    loadMatches().catch(() => [] as MatchRecord[])
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
    rows.map(async (row) => {
      const bracket = await loadBracketPrediction(row.id).catch(() => null);
      const score = scorePrediction(row.predictions, results, rules, bracket, matches);
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
  rules: ScoringRules,
  brackets: Map<string, BracketPredictions | null> = new Map(),
  matches: MatchRecord[] = []
) {
  return rows.map((row) => ({
    ...row,
    score: scorePrediction(
      row.predictions,
      results,
      rules,
      brackets.get(row.id) ?? null,
      matches
    )
  }));
}
