"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { MatchCard } from "@/components/bracket/match-card";
import { TournamentProgress } from "@/components/bracket/tournament-progress";
import { ROUND_ORDER, roundLabel } from "@/lib/tournament/bracket-structure";
import type { BracketPredictions, ResolvedMatch, Team } from "@/lib/types";
import { cn } from "@/lib/utils";

type BracketViewProps = {
  predictionId: string;
  initialMatches: ResolvedMatch[];
  initialPredictions: BracketPredictions;
  teams: Team[];
};

export function BracketView({
  predictionId,
  initialMatches,
  initialPredictions,
  teams
}: BracketViewProps) {
  const [matches, setMatches] = useState(initialMatches);
  const [predictions, setPredictions] = useState(initialPredictions);
  const [savingMatch, setSavingMatch] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [collapsedRounds, setCollapsedRounds] = useState<Record<string, boolean>>({});

  const matchesByRound = useMemo(() => {
    return ROUND_ORDER.reduce(
      (acc, round) => {
        acc[round] = matches.filter((match) => match.round === round);
        return acc;
      },
      {} as Record<string, ResolvedMatch[]>
    );
  }, [matches]);

  const savePick = useCallback(
    async (matchNumber: number, winnerId: string) => {
      setError("");
      setSavingMatch(matchNumber);
      try {
        const response = await fetch("/api/prediction", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            prediction_id: predictionId,
            match_number: matchNumber,
            winner_id: winnerId
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to save pick.");

        setPredictions(data.predictions);

        const bracketResponse = await fetch(
          `/api/bracket?prediction_id=${predictionId}`
        );
        const bracketData = await bracketResponse.json();
        if (bracketResponse.ok) {
          setMatches(bracketData.matches);
        }
      } catch (pickError) {
        setError(pickError instanceof Error ? pickError.message : "Unable to save pick.");
      } finally {
        setSavingMatch(null);
      }
    },
    [predictionId]
  );

  useEffect(() => {
    const draftKey = `wc_bracket_draft_${predictionId}`;
    localStorage.setItem(draftKey, JSON.stringify(predictions));
  }, [predictionId, predictions]);

  function toggleRound(round: string) {
    setCollapsedRounds((current) => ({
      ...current,
      [round]: !current[round]
    }));
  }

  return (
    <div className="space-y-6">
      <TournamentProgress predictions={predictions} />

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      ) : null}

      {savingMatch ? (
        <div className="flex items-center gap-2 text-sm text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving pick...
        </div>
      ) : null}

      {/* Desktop horizontal bracket */}
      <div className="hidden overflow-x-auto pb-4 lg:block">
        <div className="flex min-w-max gap-6">
          {ROUND_ORDER.map((round) => (
            <div key={round} className="flex w-[280px] flex-col gap-4">
              <h3 className="sticky top-0 z-10 rounded-md bg-primary/10 px-3 py-2 text-center text-sm font-bold text-primary">
                {roundLabel(round)}
              </h3>
              <div className="flex flex-col justify-around gap-4">
                {matchesByRound[round]?.map((match) => (
                  <MatchCard
                    key={match.match_number}
                    match={match}
                    teams={teams}
                    saving={savingMatch === match.match_number}
                    onPick={(winnerId) => savePick(match.match_number, winnerId)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile swipeable rounds */}
      <div className="space-y-4 lg:hidden">
        {ROUND_ORDER.map((round) => {
          const collapsed = collapsedRounds[round];
          return (
            <section key={round} className="overflow-hidden rounded-xl border bg-white">
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                onClick={() => toggleRound(round)}
              >
                <div>
                  <h3 className="font-bold">{roundLabel(round)}</h3>
                  <p className="text-xs text-muted-foreground">
                    {matchesByRound[round]?.length ?? 0} matches
                  </p>
                </div>
                {collapsed ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              <div
                className={cn(
                  "border-t transition-all",
                  collapsed ? "hidden" : "block"
                )}
              >
                <div className="flex gap-3 overflow-x-auto p-4 snap-x snap-mandatory">
                  {matchesByRound[round]?.map((match) => (
                    <div key={match.match_number} className="snap-center">
                      <MatchCard
                        match={match}
                        teams={teams}
                        compact
                        saving={savingMatch === match.match_number}
                        onPick={(winnerId) => savePick(match.match_number, winnerId)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {predictions.champion ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center">
          <p className="text-sm font-semibold text-primary">Your champion</p>
          <p className="mt-1 text-2xl font-black">
            {teams.find((team) => team.id === predictions.champion)?.name ?? predictions.champion}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          Pick winners through the bracket to predict your champion.
        </div>
      )}
    </div>
  );
}
