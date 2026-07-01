import { NextRequest, NextResponse } from "next/server";
import { loadMatches } from "@/lib/scoring";
import type { MatchRound } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const round = request.nextUrl.searchParams.get("round") as MatchRound | null;
    let matches = await loadMatches();

    if (round) {
      matches = matches.filter((match) => match.round === round);
    }

    return NextResponse.json({ matches });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load matches.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
