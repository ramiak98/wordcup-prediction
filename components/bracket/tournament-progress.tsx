"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { ROUND_ORDER, roundLabel } from "@/lib/tournament/bracket-structure";
import type { BracketPredictions } from "@/lib/types";
import { bracketProgress } from "@/lib/bracket";

const STEPS = ["Groups", ...ROUND_ORDER.map(roundLabel), "Completed"];

export function TournamentProgress({
  predictions,
  activeStep
}: {
  predictions?: BracketPredictions | null;
  activeStep?: string;
}) {
  const progress = predictions ? bracketProgress(predictions) : null;
  const currentIndex = activeStep
    ? STEPS.findIndex((step) => step.toLowerCase() === activeStep.toLowerCase())
    : progress?.currentRound === "completed"
      ? STEPS.length - 1
      : progress
        ? 1 + ROUND_ORDER.findIndex((round) => round === progress.currentRound)
        : 1;

  const completedIndex = Math.max(0, currentIndex);

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-semibold text-primary">Tournament progress</span>
        <span className="text-muted-foreground">
          {Math.round((completedIndex / (STEPS.length - 1)) * 100)}%
        </span>
      </div>
      <div className="hidden gap-1 md:grid md:grid-cols-8">
        {STEPS.map((step, index) => {
          const done = index < completedIndex;
          const active = index === completedIndex;
          return (
            <div key={step} className="text-center">
              <div
                className={cn(
                  "mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-all",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && !done && "border-primary bg-primary/10 text-primary scale-110",
                  !done && !active && "border-muted bg-muted/40 text-muted-foreground"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <p className={cn("text-[10px] font-medium leading-tight", active && "text-primary")}>
                {step}
              </p>
            </div>
          );
        })}
      </div>
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {STEPS.map((step, index) => {
            const done = index < completedIndex;
            const active = index === completedIndex;
            return (
              <div
                key={step}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && !done && "border-primary text-primary",
                  !done && !active && "text-muted-foreground"
                )}
              >
                {step}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${(completedIndex / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
