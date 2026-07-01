"use client";

import { cn } from "@/lib/utils";
import { formatDate, formatKickoff } from "@/lib/utils";
import type { ResolvedMatch, Team } from "@/lib/types";
import { teamById } from "@/lib/bracket";
import { Badge } from "@/components/ui/badge";

type MatchCardProps = {
  match: ResolvedMatch;
  teams: Team[];
  onPick?: (winnerId: string) => void;
  saving?: boolean;
  compact?: boolean;
};

function TeamRow({
  team,
  selected,
  onClick,
  disabled
}: {
  team: Team | null;
  selected: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  if (!team) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        TBD
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled || !onClick}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-all",
        selected
          ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/30 animate-in fade-in zoom-in-95"
          : "bg-white hover:border-primary/40 hover:bg-muted/40",
        disabled && "cursor-default opacity-80"
      )}
    >
      <div className="h-7 w-10 shrink-0 overflow-hidden rounded border bg-white">
        {team.flag_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={team.flag_url} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <span className="truncate text-sm font-semibold">{team.name}</span>
      {selected ? (
        <Badge className="ml-auto shrink-0" variant="default">
          Winner
        </Badge>
      ) : null}
    </button>
  );
}

export function MatchCard({ match, teams, onPick, saving, compact }: MatchCardProps) {
  const teamA = teamById(teams, match.team_a_resolved ?? match.team_a);
  const teamB = teamById(teams, match.team_b_resolved ?? match.team_b);
  const canPick = Boolean(onPick && teamA && teamB && !saving);
  const predicted = match.winner;

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-3 shadow-sm transition-all",
        compact ? "min-w-[220px]" : "min-w-[260px]"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <Badge variant="outline" className="text-[10px]">
          M{match.match_number}
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          {formatKickoff(match.kickoff)}
        </span>
      </div>
      <div className="space-y-2">
        <TeamRow
          team={teamA}
          selected={predicted === teamA?.id}
          disabled={!canPick}
          onClick={canPick && teamA ? () => onPick?.(teamA.id) : undefined}
        />
        <TeamRow
          team={teamB}
          selected={predicted === teamB?.id}
          disabled={!canPick}
          onClick={canPick && teamB ? () => onPick?.(teamB.id) : undefined}
        />
      </div>
      {!compact ? (
        <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
          <p>{match.stadium}</p>
          <p>{match.city}</p>
          <p>{formatDate(match.kickoff)}</p>
          {predicted ? (
            <p className="font-medium text-primary">Prediction saved</p>
          ) : teamA && teamB ? (
            <p>Pick a winner</p>
          ) : (
            <p>Awaiting previous results</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
