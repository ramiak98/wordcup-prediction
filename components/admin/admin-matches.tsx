"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Trophy } from "lucide-react";
import { useAdmin } from "@/components/admin/admin-shell";
import { MatchCard } from "@/components/bracket/match-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUND_ORDER, roundLabel } from "@/lib/tournament/bracket-structure";
import type { MatchRecord, Team } from "@/lib/types";

export function AdminMatches({ teams }: { teams: Team[] }) {
  const { adminFetch } = useAdmin();
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/matches")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load matches.");
        setMatches(data.matches ?? []);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load matches.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function setWinner(matchNumber: number, winnerId: string) {
    setSaving(matchNumber);
    setError("");
    setStatus("");
    const response = await adminFetch("/api/admin/update-match", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ match_number: matchNumber, winner_id: winnerId })
    });
    const data = await response.json();
    setSaving(null);

    if (!response.ok) {
      setError(data.error ?? "Unable to update match.");
      return;
    }

    const refresh = await fetch("/api/matches");
    const refreshData = await refresh.json();
    if (refresh.ok) setMatches(refreshData.matches ?? []);

    setStatus(`Match ${matchNumber} updated. Recalculated ${data.recalculated ?? 0} predictions.`);
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      ) : null}
      {status ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm font-medium text-primary">
          {status}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Knockout match results
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Set the official winner for each match. The bracket advances automatically and
          leaderboard scores update.
        </CardContent>
      </Card>

      {ROUND_ORDER.map((round) => {
        const roundMatches = matches.filter((match) => match.round === round);
        return (
          <section key={round} className="space-y-3">
            <h2 className="text-lg font-bold">{roundLabel(round)}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {roundMatches.map((match) => (
                <div key={match.match_number} className="space-y-2">
                  <MatchCard
                    match={{
                      ...match,
                      team_a_resolved: match.team_a,
                      team_b_resolved: match.team_b
                    }}
                    teams={teams}
                    saving={saving === match.match_number}
                    onPick={(winnerId) => setWinner(match.match_number, winnerId)}
                  />
                  {match.winner ? (
                    <p className="text-center text-xs font-medium text-primary">
                      Official winner recorded
                    </p>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground">
                      Tap a team to set official result
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <Button type="button" variant="outline" disabled>
        <Save className="h-4 w-4" />
        Results save automatically
      </Button>
    </div>
  );
}
