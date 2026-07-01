import Link from "next/link";
import { ArrowRight, Medal, ShieldCheck, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSupabaseAdmin } from "@/lib/supabase";
import { defaultTeams } from "@/lib/world-cup";
import {
  loadActualResults,
  loadBracketPrediction,
  loadMatches,
  loadScoringRules,
  scoreRows
} from "@/lib/scoring";
import { formatDate } from "@/lib/utils";
import type { LeaderboardEntry, UserPredictionRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getPublicLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const supabase = getSupabaseAdmin();
    const [results, rules, matches] = await Promise.all([
      loadActualResults(),
      loadScoringRules(),
      loadMatches().catch(() => [])
    ]);

    const { data, error } = await supabase
      .from("users_predictions")
      .select("id,full_name,predictions,total_points,created_at")
      .order("total_points", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(10);

    if (error) return [];

    const rows = (data ?? []) as UserPredictionRecord[];
    const brackets = new Map<string, Awaited<ReturnType<typeof loadBracketPrediction>>>();

    await Promise.all(
      rows.map(async (row) => {
        brackets.set(row.id, await loadBracketPrediction(row.id).catch(() => null));
      })
    );

    return scoreRows(rows, results, rules, brackets, matches).map((row, index) => ({
      id: row.id,
      full_name: row.full_name,
      total_points: row.score.total,
      rank: index + 1,
      created_at: row.created_at,
      breakdown: row.score
    }));
  } catch {
    return [];
  }
}

export default async function Home() {
  const featuredTeams = defaultTeams.slice(0, 12);
  const leaderboard = await getPublicLeaderboard();

  return (
    <main className="min-h-screen">
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div className="py-8">
            <div className="mb-5 inline-flex overflow-hidden rounded-md border bg-white text-sm font-semibold text-primary shadow-soft">
              <span className="wc-stripe w-2" aria-hidden="true" />
              <span className="flex items-center gap-2 px-3 py-2">
                <Trophy className="h-4 w-4 wc-gold-text" />
                FIFA World Cup 2026
              </span>
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-normal sm:text-6xl">
              World Cup Predictions
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Predict groups, pick the eight best third-place teams, then fill out
              the full knockout bracket from the Round of 32 to the Final.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/predict">
                  Start Prediction
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border bg-white shadow-soft">
            <div className="wc-panel-dark p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-wide text-white/70">
                Three hosts. One bracket.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm font-black">
                <span className="rounded-md bg-[hsl(var(--worldcup-red))] px-2 py-2">
                  Canada
                </span>
                <span className="rounded-md bg-[hsl(var(--worldcup-green))] px-2 py-2">
                  Mexico
                </span>
                <span className="rounded-md bg-[hsl(var(--worldcup-blue))] px-2 py-2">
                  USA
                </span>
              </div>
            </div>
            <div className="wc-stripe h-2" />
            <div className="wc-hero-surface p-4">
              <div className="grid grid-cols-3 gap-2">
                {featuredTeams.map((team) => (
                  <div key={team.id} className="rounded-lg border bg-white/90 p-3">
                    <div className="mb-3 h-10 overflow-hidden rounded-md border bg-white">
                      {team.flag_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={team.flag_url}
                          alt={`${team.name} flag`}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <p className="truncate text-sm font-bold">{team.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Group {team.group_letter}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-white/95 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2">
          {[
            {
              icon: ShieldCheck,
              title: "Full tournament bracket",
              text: "From the Round of 32 through the Final and third-place match, with auto-save after every pick."
            },
            {
              icon: Trophy,
              title: "Detailed leaderboard",
              text: "Track group picks, knockout accuracy, champion, and total points."
            }
          ].map((item) => (
            <Card key={item.title} className="shadow-none">
              <CardContent className="p-5">
                <item.icon className="mb-4 h-6 w-6 text-primary" />
                <h2 className="font-bold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Card className="overflow-hidden">
            <div className="wc-stripe h-2" />
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Medal className="h-6 w-6 text-primary" />
                  Public leaderboard
                </CardTitle>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Scores update as admins enter group and knockout results.
                </p>
              </div>
              <Badge variant="secondary">Top 10</Badge>
            </CardHeader>
            <CardContent>
              {leaderboard.length ? (
                <div className="overflow-x-auto rounded-lg border bg-white">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-3">Rank</th>
                        <th className="px-3 py-3">Name</th>
                        <th className="px-3 py-3">Groups</th>
                        <th className="px-3 py-3">R32</th>
                        <th className="px-3 py-3">R16</th>
                        <th className="px-3 py-3">QF</th>
                        <th className="px-3 py-3">SF</th>
                        <th className="px-3 py-3">Final</th>
                        <th className="px-3 py-3">Champion</th>
                        <th className="px-3 py-3">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {leaderboard.map((entry) => (
                        <tr key={entry.id} className="hover:bg-muted/40">
                          <td className="px-3 py-3 font-bold">#{entry.rank}</td>
                          <td className="px-3 py-3">
                            <Link
                              href={`/prediction/${entry.id}`}
                              className="font-semibold hover:text-primary"
                            >
                              {entry.full_name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(entry.created_at)}
                            </p>
                          </td>
                          <td className="px-3 py-3">
                            {entry.breakdown.correctGroupWinners +
                              entry.breakdown.correctRunnerUps +
                              entry.breakdown.correctThirdPlaceQualifiers}
                          </td>
                          <td className="px-3 py-3">{entry.breakdown.correctRoundOf32}</td>
                          <td className="px-3 py-3">{entry.breakdown.correctRoundOf16}</td>
                          <td className="px-3 py-3">{entry.breakdown.correctQuarterFinals}</td>
                          <td className="px-3 py-3">{entry.breakdown.correctSemiFinals}</td>
                          <td className="px-3 py-3">{entry.breakdown.correctFinal}</td>
                          <td className="px-3 py-3">{entry.breakdown.correctChampion}</td>
                          <td className="px-3 py-3">
                            <Badge>{entry.total_points} pts</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-lg border bg-white p-5 text-sm text-muted-foreground">
                  No predictions on the leaderboard yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
