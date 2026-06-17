import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { defaultTeams } from "@/lib/world-cup";
import type { Team } from "@/lib/types";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  if (!cachedClient) {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return cachedClient;
}

export async function getTeamsSafe(): Promise<Team[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("teams")
      .select("id,name,code,group_letter,flag_url")
      .order("group_letter", { ascending: true })
      .order("name", { ascending: true });

    if (error || !data?.length) return defaultTeams;
    return data as Team[];
  } catch {
    return defaultTeams;
  }
}
