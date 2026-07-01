import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { BracketView } from "@/components/bracket/bracket-view";
import { Button } from "@/components/ui/button";
import { getSupabaseAdmin, getTeamsSafe } from "@/lib/supabase";
import { buildUserBracket, emptyBracketPredictions } from "@/lib/bracket";
import { loadBracketPrediction, loadMatches } from "@/lib/scoring";
import { importTournamentMatches } from "@/lib/tournament/importer";
import type { UserPredictionRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getPrediction(id: string) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("users_predictions")
      .select("id,full_name")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as Pick<UserPredictionRecord, "id" | "full_name">;
  } catch {
    return null;
  }
}

async function ensureMatches() {
  let matches = await loadMatches().catch(() => []);
  if (!matches.length) {
    const supabase = getSupabaseAdmin();
    const teams = await getTeamsSafe();
    await importTournamentMatches(supabase, teams);
    matches = await loadMatches();
  }
  return matches;
}

export default async function BracketPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [prediction, teams, matches] = await Promise.all([
    getPrediction(id),
    getTeamsSafe(),
    ensureMatches()
  ]);

  if (!prediction) notFound();

  const bracketPredictions =
    (await loadBracketPrediction(id).catch(() => null)) ??
    emptyBracketPredictions(id);

  const resolvedMatches = buildUserBracket(matches, bracketPredictions);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <header className="overflow-hidden rounded-lg border bg-white shadow-soft">
          <div className="wc-stripe h-2" />
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Knockout Stage</p>
              <h1 className="mt-1 text-3xl font-black">
                {prediction.full_name}&apos;s Bracket
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Pick winners from the Round of 32 through the Final. Picks auto-save,
                then submit when your bracket is complete.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={`/prediction/${id}`}>Back to prediction</Link>
            </Button>
          </div>
        </header>

        <BracketView
          predictionId={id}
          initialMatches={resolvedMatches}
          initialPredictions={bracketPredictions}
          teams={teams}
        />
      </div>
    </main>
  );
}
