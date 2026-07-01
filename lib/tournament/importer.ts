import type { SupabaseClient } from "@supabase/supabase-js";
import type { MatchRecord, Team } from "@/lib/types";
import { BRACKET_TOPOLOGY } from "@/lib/tournament/bracket-structure";
import {
  cityFromGround,
  cityFromHostCity,
  fetchTournamentData,
  mapOpenFootballRound,
  mapStage
} from "@/lib/tournament/fetcher";
import { parseWinnerFromScore, resolveTeamId } from "@/lib/tournament/team-resolver";

type MatchUpsert = Omit<MatchRecord, "updated_at">;

function openFootballByRound(
  matches: Awaited<ReturnType<typeof fetchTournamentData>>["openFootballMatches"]
) {
  const grouped = new Map<string, typeof matches>();
  for (const match of matches) {
    const round = mapOpenFootballRound(match.round);
    if (!round) continue;
    const list = grouped.get(round) ?? [];
    list.push(match);
    grouped.set(round, list);
  }
  return grouped;
}

function resolveOpenFootballTeams(
  match: { team1?: string; team2?: string },
  teams: Team[]
) {
  const teamA = match.team1 ? resolveTeamId(match.team1, teams) : null;
  const teamB = match.team2 ? resolveTeamId(match.team2, teams) : null;
  return { teamA, teamB, teamALabel: match.team1 ?? null, teamBLabel: match.team2 ?? null };
}

export async function buildMatchRows(teams: Team[]): Promise<MatchUpsert[]> {
  const data = await fetchTournamentData();
  const openFootballGrouped = openFootballByRound(data.openFootballMatches);
  const usedOpenFootball = new Map<string, number>();

  const rows: MatchUpsert[] = [];

  for (const fixture of data.fixtures) {
    const round = mapStage(fixture.stage);
    if (!round) continue;

    const topology = BRACKET_TOPOLOGY.find((entry) => entry.matchNumber === fixture.matchNumber);
    const roundMatches = openFootballGrouped.get(round) ?? [];
    const index = usedOpenFootball.get(round) ?? 0;
    const openMatch = roundMatches[index];
    if (openMatch) usedOpenFootball.set(round, index + 1);

    const fromOpen = openMatch
      ? resolveOpenFootballTeams(openMatch, teams)
      : { teamA: null, teamB: null, teamALabel: null, teamBLabel: null };

    const teamA =
      fromOpen.teamA ?? resolveTeamId(fixture.homeTeam, teams);
    const teamB =
      fromOpen.teamB ?? resolveTeamId(fixture.awayTeam, teams);

    const winner =
      fromOpen.teamA && fromOpen.teamB
        ? parseWinnerFromScore(fromOpen.teamA, fromOpen.teamB, openMatch?.score)
        : null;

    rows.push({
      match_number: fixture.matchNumber,
      round,
      team_a: teamA,
      team_b: teamB,
      team_a_label: fromOpen.teamALabel ?? fixture.homeTeam,
      team_b_label: fromOpen.teamBLabel ?? fixture.awayTeam,
      stadium: fixture.stadium,
      city: openMatch?.ground ? cityFromGround(openMatch.ground) : cityFromHostCity(fixture.hostCity),
      kickoff: fixture.kickoffUtc,
      winner,
      next_match: topology?.nextMatch ?? null
    });
  }

  return rows.sort((a, b) => a.match_number - b.match_number);
}

export async function importTournamentMatches(
  supabase: SupabaseClient,
  teams: Team[],
  options: { preserveWinners?: boolean } = {}
) {
  const { preserveWinners = true } = options;
  const incoming = await buildMatchRows(teams);

  let existingWinners = new Map<number, string | null>();
  if (preserveWinners) {
    const { data } = await supabase.from("matches").select("match_number,winner");
    existingWinners = new Map(
      (data ?? []).map((row) => [row.match_number as number, row.winner as string | null])
    );
  }

  const rows = incoming.map((row) => ({
    ...row,
    winner: row.winner ?? existingWinners.get(row.match_number) ?? null
  }));

  const { error } = await supabase.from("matches").upsert(rows, {
    onConflict: "match_number"
  });
  if (error) throw error;

  for (const row of rows) {
    if (row.winner) {
      await advanceWinner(supabase, row.match_number, row.winner);
    }
  }

  return { updated: rows.length, fetchedAt: new Date().toISOString() };
}

export async function advanceWinner(
  supabase: SupabaseClient,
  matchNumber: number,
  winnerId: string
) {
  const topology = BRACKET_TOPOLOGY.find((entry) => entry.matchNumber === matchNumber);
  if (!topology) return;

  if (topology.nextMatch && topology.nextSlot) {
    const column = topology.nextSlot === "a" ? "team_a" : "team_b";
    await supabase
      .from("matches")
      .update({ [column]: winnerId })
      .eq("match_number", topology.nextMatch);
  }

  if (topology.loserNextMatch && topology.loserNextSlot) {
    const { data: match } = await supabase
      .from("matches")
      .select("team_a,team_b")
      .eq("match_number", matchNumber)
      .single();

    if (match) {
      const loserId =
        match.team_a === winnerId ? match.team_b : match.team_a;
      if (loserId) {
        const column = topology.loserNextSlot === "a" ? "team_a" : "team_b";
        await supabase
          .from("matches")
          .update({ [column]: loserId })
          .eq("match_number", topology.loserNextMatch);
      }
    }
  }
}

export async function setMatchWinner(
  supabase: SupabaseClient,
  matchNumber: number,
  winnerId: string
) {
  const { data: match, error } = await supabase
    .from("matches")
    .select("team_a,team_b")
    .eq("match_number", matchNumber)
    .single();

  if (error || !match) throw new Error("Match not found.");
  if (winnerId !== match.team_a && winnerId !== match.team_b) {
    throw new Error("Winner must be one of the teams in the match.");
  }

  await supabase
    .from("matches")
    .update({ winner: winnerId })
    .eq("match_number", matchNumber);

  await advanceWinner(supabase, matchNumber, winnerId);
}
