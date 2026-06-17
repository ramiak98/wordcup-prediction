import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Team } from "@/lib/types";

type TeamCardProps = {
  team: Team;
  selected?: boolean;
  disabled?: boolean;
  label?: string;
  onClick?: () => void;
};

export function TeamCard({
  team,
  selected,
  disabled,
  label,
  onClick
}: TeamCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-[74px] w-full items-center gap-3 rounded-lg border bg-card p-3 text-left transition hover:border-primary/50 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45",
        selected && "border-primary bg-primary/5 ring-1 ring-primary"
      )}
    >
      <span className="flex h-10 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white">
        {team.flag_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={team.flag_url}
            alt={`${team.name} flag`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs font-bold">{team.code}</span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{team.name}</span>
        <span className="text-xs text-muted-foreground">{team.code}</span>
      </span>
      {label ? (
        <span className="rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground">
          {label}
        </span>
      ) : null}
      {selected ? <Check className="h-5 w-5 shrink-0 text-primary" /> : null}
    </button>
  );
}
