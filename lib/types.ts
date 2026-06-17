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
  correctFinalists: number;
  correctChampion: number;
};
