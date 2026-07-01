import type { Team } from "@/lib/types";

const NAME_ALIASES: Record<string, string> = {
  "united states": "usa",
  usa: "usa",
  "u.s.a.": "usa",
  "cote d'ivoire": "cote-divoire",
  "côte d'ivoire": "cote-divoire",
  "ivory coast": "cote-divoire",
  "dr congo": "congo-dr",
  "congo dr": "congo-dr",
  "democratic republic of the congo": "congo-dr",
  "bosnia & herzegovina": "bosnia-herzegovina",
  "bosnia and herzegovina": "bosnia-herzegovina",
  "cape verde": "cabo-verde",
  "cabo verde": "cabo-verde",
  "korea republic": "korea-republic",
  "south korea": "korea-republic",
  "ir iran": "iran",
  iran: "iran",
  england: "england",
  netherlands: "netherlands",
  morocco: "morocco",
  paraguay: "paraguay",
  canada: "canada",
  "south africa": "south-africa",
  germany: "germany",
  brazil: "brazil",
  japan: "japan",
  france: "france",
  sweden: "sweden",
  norway: "norway",
  mexico: "mexico",
  ecuador: "ecuador",
  belgium: "belgium",
  senegal: "senegal",
  spain: "spain",
  austria: "austria",
  portugal: "portugal",
  croatia: "croatia",
  switzerland: "switzerland",
  algeria: "algeria",
  argentina: "argentina",
  colombia: "colombia",
  ghana: "ghana",
  australia: "australia",
  egypt: "egypt"
};

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveTeamId(name: string, teams: Team[]): string | null {
  if (!name || /^winner match \d+/i.test(name) || /^loser match \d+/i.test(name)) {
    return null;
  }
  if (/^w\d+$/i.test(name) || /^l\d+$/i.test(name)) return null;
  if (/group /i.test(name) || /third place/i.test(name) || /runners?-?up/i.test(name)) {
    return null;
  }

  const normalized = normalizeName(name);
  const aliasId = NAME_ALIASES[normalized];
  if (aliasId) {
    const byAlias = teams.find((team) => team.id === aliasId);
    if (byAlias) return byAlias.id;
  }

  const byId = teams.find((team) => team.id === normalized.replace(/\s+/g, "-"));
  if (byId) return byId.id;

  const byName = teams.find((team) => normalizeName(team.name) === normalized);
  if (byName) return byName.id;

  const byCode = teams.find((team) => team.code.toLowerCase() === normalized);
  if (byCode) return byCode.id;

  const partial = teams.find(
    (team) =>
      normalizeName(team.name).includes(normalized) ||
      normalized.includes(normalizeName(team.name))
  );
  return partial?.id ?? null;
}

export function parseWinnerFromScore(
  teamA: string | null,
  teamB: string | null,
  score?: { ft?: number[]; p?: number[]; et?: number[] }
): string | null {
  if (!teamA || !teamB || !score?.ft) return null;
  const [a, b] = score.ft;
  if (a > b) return teamA;
  if (b > a) return teamB;
  if (score.p) {
    const [pa, pb] = score.p;
    if (pa > pb) return teamA;
    if (pb > pa) return teamB;
  }
  return null;
}
