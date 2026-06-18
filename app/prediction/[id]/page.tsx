import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PredictionSummary } from "@/components/prediction/prediction-summary";
import { ShareCard } from "@/components/prediction/share-card";
import { getSupabaseAdmin, getTeamsSafe } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import type { UserPredictionRecord } from "@/lib/types";

async function getPrediction(id: string) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("users_predictions")
      .select("id,full_name,predictions,total_points,created_at")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as UserPredictionRecord;
  } catch {
    return null;
  }
}

export default async function PredictionPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [prediction, teams] = await Promise.all([getPrediction(id), getTeamsSafe()]);

  if (!prediction) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const shareUrl = `${siteUrl}/prediction/${prediction.id}`;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-lg border bg-white shadow-soft">
          <div className="wc-stripe h-2" />
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Prediction submitted</p>
            <h1 className="mt-1 text-3xl font-black">Thank you, {prediction.full_name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Submitted {formatDate(prediction.created_at)}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/">Back home</Link>
          </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
          <Card>
            <CardHeader>
              <CardTitle>Save your prediction</CardTitle>
            </CardHeader>
            <CardContent>
              <ShareCard
                fullName={prediction.full_name}
                prediction={prediction.predictions}
                teams={teams}
                shareUrl={shareUrl}
              />
            </CardContent>
          </Card>
          <PredictionSummary prediction={prediction.predictions} teams={teams} compact />
        </div>
      </div>
    </main>
  );
}
