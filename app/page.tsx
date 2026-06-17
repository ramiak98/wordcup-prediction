import Link from "next/link";
import { ArrowRight, BarChart3, Medal, ShieldCheck, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSupabaseAdmin } from "@/lib/supabase";
import { defaultTeams } from "@/lib/world-cup";
import { formatDate } from "@/lib/utils";

type PublicLeaderboardEntry = {
  id: string;
  full_name: string;
  total_points: number;
  created_at: string;
};

export const dynamic = "force-dynamic";

async function getPublicLeaderboard() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("users_predictions")
      .select("id,full_name,total_points,created_at")
      .order("total_points", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(10);

    if (error) return [];
    return (data ?? []) as PublicLeaderboardEntry[];
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
              Pick each group winner and runner-up, choose the eight best
              third-place teams, and keep your link for the later knockout
              prediction windows. One prediction per browser or device.
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
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "No account required",
              text: "A browser token and hashed device signals prevent duplicate votes."
            },
            {
              icon: BarChart3,
              title: "Admin scoring",
              text: "Results and scoring rules can change without touching the form."
            },
            {
              icon: Trophy,
              title: "Public leaderboard",
              text: "Everyone can follow the standings as results are updated."
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
                  Scores update after admins enter actual results. Contact details
                  stay private.
                </p>
              </div>
              <Badge variant="secondary">Top 10</Badge>
            </CardHeader>
            <CardContent>
              {leaderboard.length ? (
                <div className="divide-y rounded-lg border bg-white">
                  {leaderboard.map((entry, index) => (
                    <Link
                      key={entry.id}
                      href={`/prediction/${entry.id}`}
                      className="grid gap-3 p-4 transition hover:bg-muted/60 sm:grid-cols-[60px_1fr_auto] sm:items-center"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-sm font-black text-primary-foreground">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-bold">{entry.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Submitted {formatDate(entry.created_at)}
                        </p>
                      </div>
                      <Badge>{entry.total_points} pts</Badge>
                    </Link>
                  ))}
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
