import type { BracketPredictions, MatchRecord, MatchRound, ResolvedMatch, Team } from "@/lib/types";
import { BRACKET_TOPOLOGY, ROUND_ORDER } from "@/lib/tournament/bracket-structure";

function picksForRound(predictions: BracketPredictions, round: MatchRound) {
  switch (round) {
    case "round-of-32":
      return predictions.round32;
    case "round-of-16":
      return predictions.round16;
    case "quarter-finals":
      return predictions.quarter_finals;
    case "semi-finals":
      return predictions.semi_finals;
    case "third-place":
      return predictions.third_place;
    case "final":
      return predictions.final;
  }
}

function setPicksForRound(
  predictions: BracketPredictions,
  round: MatchRound,
  matchNumber: number,
  winnerId: string | null
): BracketPredictions {
  const key = String(matchNumber);
  const next = { ...predictions };

  const update = (record: Record<string, string>) => {
    const copy = { ...record };
    if (winnerId) copy[key] = winnerId;
    else delete copy[key];
    return copy;
  };

  switch (round) {
    case "round-of-32":
      next.round32 = update(predictions.round32);
      break;
    case "round-of-16":
      next.round16 = update(predictions.round16);
      break;
    case "quarter-finals":
      next.quarter_finals = update(predictions.quarter_finals);
      break;
    case "semi-finals":
      next.semi_finals = update(predictions.semi_finals);
      break;
    case "third-place":
      next.third_place = update(predictions.third_place);
      break;
    case "final":
      next.final = update(predictions.final);
      next.champion = winnerId;
      break;
  }

  return next;
}

export function emptyBracketPredictions(predictionId: string): BracketPredictions {
  return {
    prediction_id: predictionId,
    round32: {},
    round16: {},
    quarter_finals: {},
    semi_finals: {},
    final: {},
    third_place: {},
    champion: null
  };
}

export function resolveMatchTeams(
  match: MatchRecord,
  officialMatches: MatchRecord[],
  predictions: BracketPredictions
): { teamA: string | null; teamB: string | null } {
  const officialByNumber = new Map(
    officialMatches.map((entry) => [entry.match_number, entry])
  );
  const topology = BRACKET_TOPOLOGY.find((entry) => entry.matchNumber === match.match_number);

  function teamFromFeeder(feederMatchNumber: number, source: "winner" | "loser") {
    const feeder = officialByNumber.get(feederMatchNumber);
    if (!feeder) return null;

    if (source === "winner") {
      const feederRound = feeder.round;
      const picks = picksForRound(predictions, feederRound);
      return picks[String(feederMatchNumber)] ?? feeder.winner ?? null;
    }

    const feederRound = feeder.round;
    const picks = picksForRound(predictions, feederRound);
    const winner = picks[String(feederMatchNumber)] ?? feeder.winner;
    if (!winner) return null;
    if (feeder.team_a === winner) return feeder.team_b;
    if (feeder.team_b === winner) return feeder.team_a;
    return null;
  }

  let teamA = match.team_a;
  let teamB = match.team_b;

  if (topology?.feeders.length) {
    for (const feeder of topology.feeders) {
      const teamId = teamFromFeeder(feeder.matchNumber, feeder.source);
      if (feeder.slot === "a") teamA = teamId ?? teamA;
      if (feeder.slot === "b") teamB = teamId ?? teamB;
    }
  }

  return { teamA, teamB };
}

export function applyBracketPick(
  match: MatchRecord,
  officialMatches: MatchRecord[],
  predictions: BracketPredictions,
  winnerId: string
): BracketPredictions {
  const { teamA, teamB } = resolveMatchTeams(match, officialMatches, predictions);
  if (winnerId !== teamA && winnerId !== teamB) {
    throw new Error("Selected team is not in this match.");
  }

  let next = setPicksForRound(predictions, match.round, match.match_number, winnerId);
  const topology = BRACKET_TOPOLOGY.find((entry) => entry.matchNumber === match.match_number);
  if (!topology) return next;

  const downstreamMatches = BRACKET_TOPOLOGY.filter((entry) =>
    entry.feeders.some((feeder) => feeder.matchNumber === match.match_number)
  );

  for (const downstream of downstreamMatches) {
    next = clearDownstreamPicks(next, downstream.matchNumber);
  }

  if (topology.nextMatch) {
    next = clearDownstreamPicks(next, topology.nextMatch);
  }
  if (topology.loserNextMatch) {
    next = clearDownstreamPicks(next, topology.loserNextMatch);
  }

  return next;
}

function clearDownstreamPicks(predictions: BracketPredictions, matchNumber: number) {
  const topology = BRACKET_TOPOLOGY.find((entry) => entry.matchNumber === matchNumber);
  if (!topology) return predictions;

  let next = setPicksForRound(predictions, topology.round, matchNumber, null);

  const children = BRACKET_TOPOLOGY.filter((entry) =>
    entry.feeders.some((feeder) => feeder.matchNumber === matchNumber)
  );
  for (const child of children) {
    next = clearDownstreamPicks(next, child.matchNumber);
  }

  return next;
}

export function buildUserBracket(
  officialMatches: MatchRecord[],
  predictions: BracketPredictions
): ResolvedMatch[] {
  return officialMatches.map((match) => {
    const { teamA, teamB } = resolveMatchTeams(match, officialMatches, predictions);
    const picks = picksForRound(predictions, match.round);
    const predictedWinner = picks[String(match.match_number)] ?? null;

    return {
      ...match,
      team_a: teamA,
      team_b: teamB,
      team_a_resolved: teamA,
      team_b_resolved: teamB,
      winner: predictedWinner
    };
  });
}

export function bracketProgress(predictions: BracketPredictions) {
  const rounds = ROUND_ORDER.map((round) => {
    const picks = picksForRound(predictions, round);
    const total = BRACKET_TOPOLOGY.filter((entry) => entry.round === round).length;
    const completed = Object.keys(picks).length;
    return { round, total, completed, done: completed >= total };
  });

  const groupsDone = true;
  const currentRound =
    rounds.find((round) => !round.done)?.round ?? (predictions.champion ? "completed" : "final");

  return { groupsDone, rounds, currentRound };
}

export function teamById(teams: Team[], teamId: string | null | undefined) {
  if (!teamId) return null;
  return teams.find((team) => team.id === teamId) ?? null;
}
