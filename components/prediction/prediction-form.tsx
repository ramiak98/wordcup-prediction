"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { GROUP_LETTERS, type GroupLetter, type PredictionPayload, type Team } from "@/lib/types";
import { teamsByGroup } from "@/lib/world-cup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TeamCard } from "@/components/team-card";
import { PredictionSummary } from "@/components/prediction/prediction-summary";
import { cn } from "@/lib/utils";
import {
  clearLegacyPredictionIdentity,
  getStoredSubmission,
  getOrCreateVoteToken,
  SUBMITTED_PREDICTION_STORAGE_KEY
} from "@/lib/vote-token";

type Identity = {
  full_name: string;
  email: string;
};

type DraftState = Identity & {
  predictions: PredictionPayload;
};

const steps = ["Name", "Groups", "Third-place", "Submit"];

function emptyPrediction(): PredictionPayload {
  return {
    groups: Object.fromEntries(
      GROUP_LETTERS.map((group) => [
        group,
        { winner: "", runnerUp: "", thirdPlace: "" }
      ])
    ) as PredictionPayload["groups"],
    bestThirdPlace: []
  };
}

function createInitialDraft(): DraftState {
  return {
    full_name: "",
    email: "",
    predictions: emptyPrediction()
  };
}

function validateGroupStep(prediction: PredictionPayload) {
  for (const group of GROUP_LETTERS) {
    const selected = prediction.groups[group];
    if (!selected.winner || !selected.runnerUp) {
      return `Pick 1st and 2nd place for Group ${group}.`;
    }
    const picks = [selected.winner, selected.runnerUp, selected.thirdPlace].filter(Boolean);
    if (new Set(picks).size !== picks.length) {
      return `Group ${group} has the same team selected twice.`;
    }
  }

  const thirdPicks = GROUP_LETTERS.map(
    (group) => prediction.groups[group].thirdPlace
  ).filter(Boolean);
  if (thirdPicks.length < 8) {
    return "Pick at least 8 third-place candidates before choosing the best eight.";
  }

  return null;
}

export function PredictionForm({ teams }: { teams: Team[] }) {
  const [draft, setDraft] = useState<DraftState>(() => {
    if (typeof window === "undefined") return createInitialDraft();
    const saved = localStorage.getItem("wc_prediction_draft");
    if (!saved) return createInitialDraft();

    try {
      return JSON.parse(saved) as DraftState;
    } catch {
      localStorage.removeItem("wc_prediction_draft");
      return createInitialDraft();
    }
  });
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<ReturnType<
    typeof getStoredSubmission
  >>(() =>
    typeof window === "undefined" ? null : getStoredSubmission(localStorage)
  );
  const groupedTeams = useMemo(() => teamsByGroup(teams), [teams]);
  const thirdCandidates = GROUP_LETTERS.map(
    (group) => draft.predictions.groups[group].thirdPlace
  ).filter(Boolean) as string[];

  useEffect(() => {
    localStorage.setItem("wc_prediction_draft", JSON.stringify(draft));
  }, [draft]);

  function updateIdentity(field: keyof Identity, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateGroup(
    group: GroupLetter,
    role: keyof PredictionPayload["groups"][GroupLetter],
    teamId: string
  ) {
    setDraft((current) => {
      const currentGroup = current.predictions.groups[group];
      const nextGroup = { ...currentGroup, [role]: teamId };
      for (const key of ["winner", "runnerUp", "thirdPlace"] as const) {
        if (key !== role && nextGroup[key] === teamId) nextGroup[key] = "";
      }

      const nextBestThird = current.predictions.bestThirdPlace.filter(
        (id) => id !== currentGroup.thirdPlace || role !== "thirdPlace"
      );

      return {
        ...current,
        predictions: {
          ...current.predictions,
          groups: {
            ...current.predictions.groups,
            [group]: nextGroup
          },
          bestThirdPlace: nextBestThird
        }
      };
    });
  }

  function toggleBestThird(teamId: string) {
    setDraft((current) => {
      const selected = current.predictions.bestThirdPlace;
      const isSelected = selected.includes(teamId);
      const next = isSelected
        ? selected.filter((id) => id !== teamId)
        : selected.length < 8
          ? [...selected, teamId]
          : selected;

      return {
        ...current,
        predictions: {
          ...current.predictions,
          bestThirdPlace: next
        }
      };
    });
  }

  function goNext() {
    setError("");
    if (step === 0 && draft.full_name.trim().length < 2) {
      setError("Enter your full name to continue.");
      return;
    }
    if (step === 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      setError("Enter a valid email address to continue.");
      return;
    }
    if (step === 1) {
      const groupError = validateGroupStep(draft.predictions);
      if (groupError) {
        setError(groupError);
        return;
      }
    }
    if (step === 2 && draft.predictions.bestThirdPlace.length !== 8) {
      setError("Select exactly 8 best third-place teams.");
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function submitPrediction() {
    setError("");
    const groupError = validateGroupStep(draft.predictions);
    if (groupError) {
      setStep(1);
      setError(groupError);
      return;
    }
    if (draft.predictions.bestThirdPlace.length !== 8) {
      setStep(2);
      setError("Select exactly 8 best third-place teams.");
      return;
    }

    setLoading(true);
    try {
      const voteToken = getOrCreateVoteToken(localStorage);
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          full_name: draft.full_name,
          email: draft.email,
          vote_token: voteToken,
          predictions: {
            groups: draft.predictions.groups,
            bestThirdPlace: draft.predictions.bestThirdPlace
          }
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to submit prediction.");
      }

      localStorage.setItem(SUBMITTED_PREDICTION_STORAGE_KEY, data.id);
      clearLegacyPredictionIdentity(localStorage);
      localStorage.removeItem("wc_prediction_draft");
      window.location.href = `/prediction/${data.id}/bracket`;
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to submit prediction."
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>You already submitted a prediction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {submitted.source === "legacy"
              ? "This browser has a prediction saved by the previous duplicate-vote system."
              : "This browser has already submitted a prediction."}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <a href={`/prediction/${submitted.id}/bracket`}>Continue to Knockout Stage</a>
            </Button>
            <Button asChild variant="outline">
              <a href={`/prediction/${submitted.id}`}>View prediction</a>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (submitted.source === "legacy") {
                  clearLegacyPredictionIdentity(localStorage);
                } else {
                  localStorage.removeItem(SUBMITTED_PREDICTION_STORAGE_KEY);
                }
                setSubmitted(null);
              }}
            >
              {submitted.source === "legacy"
                ? "This is not my prediction"
                : "Admin reset was done"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {steps.map((label, index) => (
            <Badge
              key={label}
              variant={index === step ? "default" : index < step ? "secondary" : "outline"}
            >
              {index < step ? <Check className="mr-1 h-3 w-3" /> : null}
              Step {index + 1} {label}
            </Badge>
          ))}
        </div>
        <Progress value={(step / (steps.length - 1)) * 100} />
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      ) : null}

      {step === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={draft.full_name}
                onChange={(event) => updateIdentity("full_name", event.target.value)}
                autoComplete="name"
                placeholder="Alex Morgan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={draft.email}
                onChange={(event) => updateIdentity("email", event.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 1 ? (
        <div className="space-y-5">
          {GROUP_LETTERS.map((group) => (
            <Card key={group}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Group {group}</CardTitle>
                  <Badge variant="outline">
                    {draft.predictions.groups[group].winner &&
                    draft.predictions.groups[group].runnerUp
                      ? "Ready"
                      : "Needs picks"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {groupedTeams[group].map((team) => {
                  const selected = draft.predictions.groups[group];
                  const role =
                    selected.winner === team.id
                      ? "1st"
                      : selected.runnerUp === team.id
                        ? "2nd"
                        : selected.thirdPlace === team.id
                          ? "3rd"
                          : undefined;
                  return (
                    <div
                      key={team.id}
                      className={cn(
                        "rounded-lg border bg-white p-3",
                        role && "border-primary/70"
                      )}
                    >
                      <TeamCard team={team} selected={Boolean(role)} label={role} />
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={selected.winner === team.id ? "default" : "outline"}
                          onClick={() => updateGroup(group, "winner", team.id)}
                        >
                          1st
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={selected.runnerUp === team.id ? "default" : "outline"}
                          onClick={() => updateGroup(group, "runnerUp", team.id)}
                        >
                          2nd
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={selected.thirdPlace === team.id ? "default" : "outline"}
                          onClick={() => updateGroup(group, "thirdPlace", team.id)}
                        >
                          3rd
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>Select 8 best third-place teams</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3 text-sm">
              <span>Selected</span>
              <strong>{draft.predictions.bestThirdPlace.length} / 8</strong>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {thirdCandidates.map((teamId) => {
                const team = teams.find((item) => item.id === teamId);
                if (!team) return null;
                return (
                  <TeamCard
                    key={teamId}
                    team={team}
                    selected={draft.predictions.bestThirdPlace.includes(teamId)}
                    onClick={() => toggleBestThird(teamId)}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <div className="space-y-5">
          <PredictionSummary prediction={draft.predictions} teams={teams} />
          <Card>
            <CardHeader>
              <CardTitle>Ready for the Knockout Stage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Submit your group-stage prediction, then continue straight into the
                official Round of 32 bracket. Picks auto-save as you go.
              </p>
              <Button
                type="button"
                size="lg"
                className="w-full sm:w-auto"
                onClick={submitPrediction}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Submit &amp; continue to Knockout Stage
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={step === 0 || loading}
          onClick={() => {
            setError("");
            setStep((current) => Math.max(current - 1, 0));
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        {step < steps.length - 1 ? (
          <Button type="button" disabled={loading} onClick={goNext}>
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
