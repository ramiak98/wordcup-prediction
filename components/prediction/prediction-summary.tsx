import { LockKeyhole } from "lucide-react";
import { GROUP_LETTERS, type PredictionPayload, type Team } from "@/lib/types";
import { teamName } from "@/lib/world-cup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PredictionSummaryProps = {
  prediction: PredictionPayload;
  teams: Team[];
  compact?: boolean;
};

export function PredictionSummary({
  prediction,
  teams,
  compact
}: PredictionSummaryProps) {
  return (
    <div className={compact ? "space-y-4" : "grid gap-5 lg:grid-cols-[1.4fr_0.9fr]"}>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Group picks</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {GROUP_LETTERS.map((group) => {
            const groupPrediction = prediction.groups[group];
            return (
              <div key={group} className="rounded-lg border bg-white p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-semibold">Group {group}</span>
                  {groupPrediction.thirdPlace ? (
                    <Badge variant="secondary">3rd picked</Badge>
                  ) : null}
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">1st</dt>
                    <dd className="text-right font-medium">
                      {teamName(teams, groupPrediction.winner)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">2nd</dt>
                    <dd className="text-right font-medium">
                      {teamName(teams, groupPrediction.runnerUp)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">3rd</dt>
                    <dd className="text-right font-medium">
                      {teamName(teams, groupPrediction.thirdPlace)}
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Best third-place teams</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {prediction.bestThirdPlace.map((teamId) => (
              <Badge key={teamId} variant="outline">
                {teamName(teams, teamId)}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-primary" />
              Knockout rounds locked
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-6 text-muted-foreground">
              Round of 32 and later knockout predictions will open after the real
              qualified teams are known. This prediction link will be used again
              for the next phase.
            </p>
            <Badge variant="accent">Next phase opens later</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
