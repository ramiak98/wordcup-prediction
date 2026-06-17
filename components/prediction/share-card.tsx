"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Download, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PredictionPayload, Team } from "@/lib/types";
import { GROUP_LETTERS } from "@/lib/types";
import { qualifiedTeamIds, teamName } from "@/lib/world-cup";

type ShareCardProps = {
  fullName: string;
  prediction: PredictionPayload;
  teams: Team[];
  shareUrl: string;
};

export function ShareCard({
  fullName,
  prediction,
  teams,
  shareUrl
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const qualifiedCount = qualifiedTeamIds(prediction).length;

  async function downloadCard() {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#f6faff",
      scale: 2
    });
    const link = document.createElement("a");
    link.download = "world-cup-prediction.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className="overflow-hidden rounded-lg border bg-white text-[hsl(var(--foreground))] shadow-soft"
      >
        <div className="wc-stripe h-2" />
        <div className="wc-panel-dark p-5 text-white">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-white/70">
                World Cup Predictions
              </p>
              <h2 className="mt-1 text-2xl font-black">{fullName}</h2>
            </div>
            <Badge variant="secondary">2026</Badge>
          </div>
        </div>
        <div className="wc-hero-surface p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-muted-foreground">Predicted qualifiers</p>
              <p className="mt-1 text-xl font-black">{qualifiedCount} teams</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-muted-foreground">Group winners</p>
              <p className="mt-1 text-xl font-black">{GROUP_LETTERS.length} picks</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Best third-place qualifiers
            </p>
            <div className="flex flex-wrap gap-2">
              {prediction.bestThirdPlace.map((teamId) => (
                <span
                  key={teamId}
                  className="rounded-md bg-white px-2 py-1 text-xs font-semibold"
                >
                  {teamName(teams, teamId)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" onClick={copyLink} variant="outline">
          <Link2 className="h-4 w-4" />
          {copied ? "Copied" : "Copy share link"}
        </Button>
        <Button type="button" onClick={downloadCard}>
          <Download className="h-4 w-4" />
          Download card
        </Button>
      </div>
    </div>
  );
}
