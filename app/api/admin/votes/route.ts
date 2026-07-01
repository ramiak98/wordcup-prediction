import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { assertAdmin } from "@/lib/security";
import { loadActualResults, loadBracketPrediction, loadMatches, loadScoringRules, scoreRows } from "@/lib/scoring";
import { defaultScoringRules, qualifiedTeamIds } from "@/lib/world-cup";
import type { UserPredictionRecord } from "@/lib/types";

function includesTeam(row: UserPredictionRecord, teamId: string) {
  const selected = new Set(qualifiedTeamIds(row.predictions));
  return selected.has(teamId);
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(rows: ReturnType<typeof scoreRows>) {
  const headers = [
    "Name",
    "Email",
    "Total points",
    "Correct qualified teams",
    "Correct group winners",
    "Correct runner-ups",
    "Correct third-place qualifiers",
    "Created at"
  ];

  const lines = rows.map((row) =>
    [
      row.full_name,
      row.email,
      row.score.total,
      row.score.correctQualifiedTeams,
      row.score.correctGroupWinners,
      row.score.correctRunnerUps,
      row.score.correctThirdPlaceQualifiers,
      row.created_at
    ]
      .map(csvEscape)
      .join(",")
  );

  return [headers.map(csvEscape).join(","), ...lines].join("\n");
}

export async function GET(request: NextRequest) {
  const auth = assertAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const supabase = getSupabaseAdmin();
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const team = request.nextUrl.searchParams.get("team")?.trim();
    const format = request.nextUrl.searchParams.get("format");

    let query = supabase
      .from("users_predictions")
      .select("*")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("full_name", `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = ((data ?? []) as UserPredictionRecord[]).filter((row) =>
      team ? includesTeam(row, team) : true
    );

    const [results, rules, matches] = await Promise.all([
      loadActualResults().catch(() => null),
      loadScoringRules().catch(() => defaultScoringRules),
      loadMatches().catch(() => [])
    ]);

    const brackets = new Map<string, Awaited<ReturnType<typeof loadBracketPrediction>>>();
    await Promise.all(
      rows.map(async (row) => {
        brackets.set(row.id, await loadBracketPrediction(row.id).catch(() => null));
      })
    );

    const scoredRows = scoreRows(rows, results, rules, brackets, matches);

    if (format === "csv") {
      return new NextResponse(toCsv(scoredRows), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": "attachment; filename=world-cup-votes.csv"
        }
      });
    }

    return NextResponse.json({ votes: scoredRows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load votes.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = assertAdmin(request);
  if (!auth.ok) return auth.response;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing vote id." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("users_predictions").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete vote.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
