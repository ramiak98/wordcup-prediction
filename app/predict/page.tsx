import Link from "next/link";
import { PredictionForm } from "@/components/prediction/prediction-form";
import { getTeamsSafe } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function PredictPage() {
  const teams = await getTeamsSafe();

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center overflow-hidden rounded-md border bg-white text-sm font-semibold text-primary"
            >
              <span className="wc-stripe h-8 w-2" aria-hidden="true" />
              <span className="px-3">World Cup Predictions</span>
            </Link>
            <h1 className="mt-2 text-3xl font-black">Create your prediction</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Submit the group-stage phase now: group winners, runner-ups, and
              the 8 best third-place qualifiers. Knockout predictions open later.
            </p>
          </div>
        </header>
        <PredictionForm teams={teams} />
      </div>
    </main>
  );
}
