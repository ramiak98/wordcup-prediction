import type { MatchRound } from "@/lib/types";
import { BRACKET_TOPOLOGY } from "@/lib/tournament/bracket-structure";

const FIXTURES_URL = "https://www.thestatsapi.com/world-cup/data/fixtures.json";
const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

export type ExternalFixture = {
  matchNumber: number;
  date: string;
  kickoffUtc: string;
  stage: string;
  homeTeam: string;
  awayTeam: string;
  stadium: string;
  hostCity: string;
};

export type OpenFootballMatch = {
  round?: string;
  team1?: string;
  team2?: string;
  date?: string;
  ground?: string;
  score?: { ft?: number[]; p?: number[]; et?: number[] };
};

export type TournamentFixtureData = {
  fixtures: ExternalFixture[];
  openFootballMatches: OpenFootballMatch[];
  fetchedAt: string;
};

const STAGE_MAP: Record<string, MatchRound> = {
  "round-of-32": "round-of-32",
  "round-of-16": "round-of-16",
  "quarter-finals": "quarter-finals",
  "semi-finals": "semi-finals",
  "third-place": "third-place",
  final: "final"
};

const OPENFOOTBALL_ROUND_MAP: Record<string, MatchRound> = {
  "Round of 32": "round-of-32",
  "Round of 16": "round-of-16",
  "Quarter-final": "quarter-finals",
  "Semi-final": "semi-finals",
  "Match for third place": "third-place",
  Final: "final"
};

export function mapStage(stage: string): MatchRound | null {
  return STAGE_MAP[stage] ?? null;
}

export function mapOpenFootballRound(round?: string): MatchRound | null {
  if (!round) return null;
  return OPENFOOTBALL_ROUND_MAP[round] ?? null;
}

export async function fetchTournamentData(): Promise<TournamentFixtureData> {
  const [fixturesResponse, openFootballResponse] = await Promise.all([
    fetch(FIXTURES_URL, { headers: { accept: "application/json" } }),
    fetch(OPENFOOTBALL_URL, { headers: { accept: "application/json" } })
  ]);

  if (!fixturesResponse.ok) {
    throw new Error(`Failed to fetch fixtures (${fixturesResponse.status})`);
  }
  if (!openFootballResponse.ok) {
    throw new Error(`Failed to fetch openfootball data (${openFootballResponse.status})`);
  }

  const fixturesPayload = (await fixturesResponse.json()) as {
    fixtures: ExternalFixture[];
  };
  const openFootballPayload = (await openFootballResponse.json()) as {
    matches: OpenFootballMatch[];
  };

  const knockoutFixtures = fixturesPayload.fixtures.filter(
    (fixture) => fixture.matchNumber >= 73 && fixture.matchNumber <= 104
  );

  const openFootballMatches = (openFootballPayload.matches ?? []).filter((match) => {
    const round = mapOpenFootballRound(match.round);
    return Boolean(round);
  });

  return {
    fixtures: knockoutFixtures,
    openFootballMatches,
    fetchedAt: new Date().toISOString()
  };
}

export function getTopologyNextMatch(matchNumber: number) {
  return BRACKET_TOPOLOGY.find((entry) => entry.matchNumber === matchNumber)?.nextMatch ?? null;
}

export function cityFromHostCity(hostCity: string) {
  return hostCity
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function cityFromGround(ground?: string) {
  if (!ground) return "TBD";
  return ground.split("(")[0]?.trim() ?? ground;
}
