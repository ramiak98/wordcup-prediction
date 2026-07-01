#!/usr/bin/env npx tsx
import { createClient } from "@supabase/supabase-js";
import { defaultTeams } from "../lib/world-cup";
import { importTournamentMatches } from "../lib/tournament/importer";
import type { Team } from "../lib/types";

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: teamRows, error: teamError } = await supabase
    .from("teams")
    .select("id,name,code,group_letter,flag_url")
    .order("name");

  if (teamError) {
    console.error("Failed to load teams:", teamError.message);
    process.exit(1);
  }

  const teams = (teamRows?.length ? teamRows : defaultTeams) as Team[];
  console.log(`Loaded ${teams.length} teams`);

  console.log("Fetching latest FIFA World Cup 2026 knockout data...");
  const result = await importTournamentMatches(supabase, teams, {
    preserveWinners: true
  });

  console.log(`Updated ${result.updated} matches at ${result.fetchedAt}`);
  console.log("User bracket predictions preserved.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
