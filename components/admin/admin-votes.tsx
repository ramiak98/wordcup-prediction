"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Search, Trash2, X } from "lucide-react";
import { useAdmin } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PredictionSummary } from "@/components/prediction/prediction-summary";
import { formatDate } from "@/lib/utils";
import type { ScoreBreakdown, Team, UserPredictionRecord } from "@/lib/types";

type VoteWithScore = UserPredictionRecord & {
  score: ScoreBreakdown;
};

export function AdminVotes({ teams }: { teams: Team[] }) {
  const { adminFetch } = useAdmin();
  const [votes, setVotes] = useState<VoteWithScore[]>([]);
  const [search, setSearch] = useState("");
  const [team, setTeam] = useState("");
  const [selected, setSelected] = useState<VoteWithScore | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (team) params.set("team", team);
    return params.toString();
  }, [search, team]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError("");
      adminFetch(`/api/admin/votes${query ? `?${query}` : ""}`)
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error ?? "Unable to load votes.");
          setVotes(data.votes ?? []);
        })
        .catch((voteError) => {
          setError(voteError instanceof Error ? voteError.message : "Unable to load votes.");
        })
        .finally(() => setLoading(false));
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [adminFetch, query]);

  async function deleteVote(id: string) {
    if (!confirm("Delete this vote?")) return;
    const response = await adminFetch(`/api/admin/votes?id=${id}`, {
      method: "DELETE"
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Unable to delete vote.");
      return;
    }
    setVotes((current) => current.filter((vote) => vote.id !== id));
    setSelected(null);
  }

  async function exportCsv() {
    const response = await adminFetch(
      `/api/admin/votes${query ? `?${query}&format=csv` : "?format=csv"}`
    );
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to export CSV.");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "world-cup-votes.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Votes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_260px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name"
                className="pl-9"
              />
            </div>
            <Select value={team} onChange={(event) => setTeam(event.target.value)}>
              <option value="">All teams</option>
              {teams.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Button type="button" variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {votes.map((vote) => (
                  <TableRow key={vote.id}>
                    <TableCell className="font-semibold">{vote.full_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{vote.email ?? "No email"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge>{vote.score.total} pts</Badge>
                    </TableCell>
                    <TableCell>{formatDate(vote.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setSelected(vote)}
                        >
                          View
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          onClick={() => deleteVote(vote.id)}
                          aria-label="Delete vote"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selected ? (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/30 p-4">
          <div className="mx-auto max-w-5xl rounded-lg bg-background p-4 shadow-soft">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">{selected.full_name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selected.score.total} points
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setSelected(null)}
                aria-label="Close prediction"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <PredictionSummary prediction={selected.predictions} teams={teams} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
