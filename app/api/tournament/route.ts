import { NextResponse } from "next/server";
import { getSupabaseAdmin, getTeamsSafe } from "@/lib/supabase";
import { loadMatches } from "@/lib/scoring";
import { importTournamentMatches } from "@/lib/tournament/importer";
import { fetchTournamentData } from "@/lib/tournament/fetcher";
import { ROUND_ORDER } from "@/lib/tournament/bracket-structure";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let matches = await loadMatches().catch(() => []);

    if (!matches.length) {
      const supabase = getSupabaseAdmin();
      const teams = await getTeamsSafe();
      await importTournamentMatches(supabase, teams);
      matches = await loadMatches();
    }

    const meta = await fetchTournamentData().catch(() => null);

    return NextResponse.json({
      edition: "2026 FIFA World Cup",
      rounds: ROUND_ORDER,
      matchCount: matches.length,
      lastFetched: meta?.fetchedAt ?? null,
      matches
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load tournament data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
