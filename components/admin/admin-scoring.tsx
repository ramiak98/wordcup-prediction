"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useAdmin } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultScoringRules } from "@/lib/world-cup";
import type { ScoringRules } from "@/lib/types";

const labels: Record<keyof ScoringRules, string> = {
  correct_qualified_team: "Correct group pick (Ro32 qualifier)",
  correct_group_winner: "Correct group winner",
  correct_group_runner_up: "Correct group runner-up",
  correct_third_place_qualifier: "Correct third-place qualifier",
  correct_round_of_32: "Correct Round of 32 winner",
  correct_round_of_16: "Correct Round of 16 winner",
  correct_quarter_final: "Correct quarterfinal winner",
  correct_semi_final: "Correct semifinal winner",
  correct_third_place: "Correct third-place winner",
  correct_final: "Correct final winner",
  correct_finalist: "Correct finalist",
  correct_champion: "Correct champion"
};

const ruleKeys = Object.keys(defaultScoringRules) as (keyof ScoringRules)[];

export function AdminScoring() {
  const { adminFetch } = useAdmin();
  const [rules, setRules] = useState<ScoringRules>(defaultScoringRules);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/scoring")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load scoring.");
        setRules({ ...defaultScoringRules, ...data.rules });
      })
      .catch((scoringError) => {
        setError(
          scoringError instanceof Error ? scoringError.message : "Unable to load scoring."
        );
      })
      .finally(() => setLoading(false));
  }, [adminFetch]);

  async function save() {
    setStatus("");
    setError("");
    const response = await adminFetch("/api/admin/scoring", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(rules)
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Unable to save scoring.");
      return;
    }
    setStatus(`Saved. Recalculated ${data.recalculated ?? 0} votes.`);
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
          <CardTitle>Scoring rules</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {ruleKeys.map((key) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{labels[key]}</Label>
              <Input
                id={key}
                type="number"
                min={0}
                max={100}
                value={rules[key]}
                onChange={(event) =>
                  setRules((current) => ({
                    ...current,
                    [key]: Number(event.target.value)
                  }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>
      <Button type="button" size="lg" onClick={save}>
        <Save className="h-4 w-4" />
        Save scoring and recalculate
      </Button>
    </div>
  );
}
