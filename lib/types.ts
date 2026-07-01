export const GROUP_LETTERS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L"
] as const;

export type GroupLetter = (typeof GROUP_LETTERS)[number];

export type Team = {
  id: string;
  name: string;
  code: string;
  group_letter: GroupLetter;
  flag_url: string | null;
};

export type GroupPrediction = {
  winner: string;
  runnerUp: string;
  thirdPlace?: string;
};

export type KnockoutPrediction = {
  champion?: string;
  finalist?: string;
  semiFinalists?: string[];
};

export type PredictionPayload = {
  groups: Record<GroupLetter, GroupPrediction>;
  bestThirdPlace: string[];
  knockout?: KnockoutPrediction;
};

export type MatchRound =
  | "round-of-32"
  | "round-of-16"
  | "quarter-finals"
  | "semi-finals"
  | "third-place"
  | "final";

export type MatchRecord = {
  match_number: number;
  round: MatchRound;
  team_a: string | null;
  team_b: string | null;
  team_a_label: string | null;
  team_b_label: string | null;
  stadium: string;
  city: string;
  kickoff: string;
  winner: string | null;
  next_match: number | null;
  updated_at?: string;
};

export type ResolvedMatch = MatchRecord & {
  team_a_resolved: string | null;
  team_b_resolved: string | null;
};

export type BracketPredictions = {
  prediction_id: string;
  round32: Record<string, string>;
  round16: Record<string, string>;
  quarter_finals: Record<string, string>;
  semi_finals: Record<string, string>;
  final: Record<string, string>;
  third_place: Record<string, string>;
  champion: string | null;
  submitted_at?: string | null;
  updated_at?: string;
};

export type ActualResultsPayload = {
  groupWinners: Partial<Record<GroupLetter, string>>;
  groupRunnerUps: Partial<Record<GroupLetter, string>>;
  thirdPlaceQualifiers: string[];
  finalists: string[];
  champion?: string;
};

export type ScoringRules = {
  correct_qualified_team: number;
  correct_group_winner: number;
  correct_group_runner_up: number;
  correct_third_place_qualifier: number;
  correct_round_of_32: number;
  correct_round_of_16: number;
  correct_quarter_final: number;
  correct_semi_final: number;
  correct_third_place: number;
  correct_final: number;
  correct_finalist: number;
  correct_champion: number;
};

export type UserPredictionRecord = {
  id: string;
  full_name: string;
  email: string | null;
  vote_token?: string | null;
  ip_hash?: string | null;
  user_agent_hash?: string | null;
  predictions: PredictionPayload;
  total_points: number;
  created_at: string;
};

export type ScoreBreakdown = {
  total: number;
  correctQualifiedTeams: number;
  correctGroupWinners: number;
  correctRunnerUps: number;
  correctThirdPlaceQualifiers: number;
  correctRoundOf32: number;
  correctRoundOf16: number;
  correctQuarterFinals: number;
  correctSemiFinals: number;
  correctFinal: number;
  correctThirdPlace: number;
  correctFinalists: number;
  correctChampion: number;
};

export type LeaderboardEntry = {
  id: string;
  full_name: string;
  total_points: number;
  rank: number;
  created_at: string;
  breakdown: ScoreBreakdown;
};
