import type { SupabaseClient } from "@supabase/supabase-js";

export function findPredictionByVoteToken(
  supabase: SupabaseClient,
  voteToken: string
) {
  return supabase
    .from("users_predictions")
    .select("id")
    .eq("vote_token", voteToken)
    .limit(1);
}
