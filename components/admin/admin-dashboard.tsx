"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Clock, Medal, Trophy, Users, Loader2 } from "lucide-react";
import { useAdmin } from "@/components/admin/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { qualifiedTeamIds, teamName } from "@/lib/world-cup";
import type { ScoreBreakdown, Team, UserPredictionRecord } from "@/lib/types";

type VoteWithScore = UserPredictionRecord & {
  score: ScoreBreakdown;
};

function topCounts(counts: Map<string, number>, teams: Team[], limit = 5) {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([teamId, value]) => ({ team: teamName(teams, teamId), votes: value }));
}

export function AdminDashboard({ teams }: { teams: Team[] }) {
  const { adminFetch } = useAdmin();
  const [votes, setVotes] = useState<VoteWithScore[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError("");
      const response = await adminFetch("/api/admin/votes");
      const data = await response.json();
      if (ignore) return;
      if (!response.ok) {
        setError(data.error ?? "Unable to load dashboard.");
      } else {
        setVotes(data.votes ?? []);
      }
      setLoading(false);
    }
    load().catch((dashboardError) => {
      if (!ignore) {
        setError(
          dashboardError instanceof Error
            ? dashboardError.message
            : "Unable to load dashboard."
        );
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [adminFetch]);

  const stats = useMemo(() => {
    const groupWinners = new Map<string, number>();
    const qualified = new Map<string, number>();

    for (const vote of votes) {
      for (const groupPrediction of Object.values(vote.predictions.groups)) {
        if (groupPrediction.winner) {
          groupWinners.set(
            groupPrediction.winner,
            (groupWinners.get(groupPrediction.winner) ?? 0) + 1
          );
        }
      }
      for (const teamId of qualifiedTeamIds(vote.predictions)) {
        qualified.set(teamId, (qualified.get(teamId) ?? 0) + 1);
      }
    }

    return {
      groupWinners: topCounts(groupWinners, teams),
      qualified: topCounts(qualified, teams),
      leaderboard: [...votes].sort((a, b) => b.score.total - a.score.total).slice(0, 10),
      latest: votes.slice(0, 5)
    };
  }, [teams, votes]);

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total votes</p>
              <p className="text-3xl font-black">{votes.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <Trophy className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Top group winner pick</p>
              <p className="text-xl font-black">
                {stats.groupWinners[0]?.team ?? "No picks"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <Medal className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Top qualifier pick</p>
              <p className="text-xl font-black">
                {stats.qualified[0]?.team ?? "No picks"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Latest submission</p>
              <p className="text-sm font-bold">
                {stats.latest[0] ? formatDate(stats.latest[0].created_at) : "None"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Most predicted qualified teams</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.qualified}>
                <XAxis dataKey="team" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="votes" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most common group winner picks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.groupWinners.map((item) => (
              <div
                key={item.team}
                className="flex items-center justify-between rounded-lg border bg-white p-3"
              >
                <span className="font-semibold">{item.team}</span>
                <Badge variant="secondary">{item.votes} votes</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Qualified</TableHead>
                <TableHead>Winners</TableHead>
                <TableHead>Runner-ups</TableHead>
                <TableHead>3rd-place</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.leaderboard.map((vote) => (
                <TableRow key={vote.id}>
                  <TableCell className="font-semibold">{vote.full_name}</TableCell>
                  <TableCell>{vote.score.total}</TableCell>
                  <TableCell>{vote.score.correctQualifiedTeams}</TableCell>
                  <TableCell>{vote.score.correctGroupWinners}</TableCell>
                  <TableCell>{vote.score.correctRunnerUps}</TableCell>
                  <TableCell>{vote.score.correctThirdPlaceQualifiers}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Latest submissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.latest.map((vote) => (
            <div
              key={vote.id}
              className="flex flex-col justify-between gap-2 rounded-lg border bg-white p-3 sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-semibold">{vote.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(vote.created_at)}
                </p>
              </div>
              <Badge>{vote.score.total} pts</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
