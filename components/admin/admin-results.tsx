"use client";

import { useEffect, useState } from "react";
import { Loader2, LockKeyhole, Save } from "lucide-react";
import { useAdmin } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GROUP_LETTERS, type ActualResultsPayload, type GroupLetter, type Team } from "@/lib/types";
import { teamsByGroup } from "@/lib/world-cup";

function emptyResults(): ActualResultsPayload {
  return {
    groupWinners: {},
    groupRunnerUps: {},
    thirdPlaceQualifiers: [],
    finalists: [],
    champion: ""
  };
}

export function AdminResults({ teams }: { teams: Team[] }) {
  const { adminFetch } = useAdmin();
  const [results, setResults] = useState<ActualResultsPayload>(emptyResults);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const groupedTeams = teamsByGroup(teams);

  useEffect(() => {
    adminFetch("/api/admin/results")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load results.");
        if (data.results) setResults(data.results);
      })
      .catch((resultsError) => {
        setError(
          resultsError instanceof Error ? resultsError.message : "Unable to load results."
        );
      })
      .finally(() => setLoading(false));
  }, [adminFetch]);

  function setGroupResult(
    group: GroupLetter,
    field: "groupWinners" | "groupRunnerUps",
    teamId: string
  ) {
    setResults((current) => ({
      ...current,
      [field]: {
        ...current[field],
        [group]: teamId
      }
    }));
  }

  function toggleThirdPlaceQualifier(teamId: string) {
    setResults((current) => {
      const currentList = current.thirdPlaceQualifiers;
      const next = currentList.includes(teamId)
        ? currentList.filter((id) => id !== teamId)
        : currentList.length < 8
          ? [...currentList, teamId]
          : currentList;
      return { ...current, thirdPlaceQualifiers: next };
    });
  }

  async function saveResults() {
    setError("");
    setStatus("");
    const response = await adminFetch("/api/admin/results", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(results)
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Unable to save results.");
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
          <CardTitle>Group results</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {GROUP_LETTERS.map((group) => (
            <div key={group} className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 font-bold">Group {group}</h2>
              <div className="space-y-3">
                <Select
                  value={results.groupWinners[group] ?? ""}
                  onChange={(event) =>
                    setGroupResult(group, "groupWinners", event.target.value)
                  }
                >
                  <option value="">Winner</option>
                  {groupedTeams[group].map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </Select>
                <Select
                  value={results.groupRunnerUps[group] ?? ""}
                  onChange={(event) =>
                    setGroupResult(group, "groupRunnerUps", event.target.value)
                  }
                >
                  <option value="">Runner-up</option>
                  {groupedTeams[group].map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Qualified third-place teams</CardTitle>
            <Badge variant="outline">{results.thirdPlaceQualifiers.length} / 8</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {teams.map((team) => (
            <Button
              key={team.id}
              type="button"
              variant={
                results.thirdPlaceQualifiers.includes(team.id) ? "default" : "outline"
              }
              onClick={() => toggleThirdPlaceQualifier(team.id)}
              className="justify-start"
            >
              {team.name}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LockKeyhole className="h-5 w-5 text-primary" />
            Knockout results locked
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            Finalists, champion, and later knockout-stage results will be managed
            when the knockout prediction phase opens. Current scoring uses group
            winners, runner-ups, qualified teams, and qualified third-place teams.
          </p>
        </CardContent>
      </Card>

      <Button type="button" size="lg" onClick={saveResults}>
        <Save className="h-4 w-4" />
        Save results and recalculate
      </Button>
    </div>
  );
}
