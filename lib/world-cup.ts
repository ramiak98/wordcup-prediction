import { GROUP_LETTERS, type GroupLetter, type Team } from "@/lib/types";

const flag = (code: string) => `https://flagcdn.com/${code.toLowerCase()}.svg`;

export const defaultTeams: Team[] = [
  { id: "mexico", name: "Mexico", code: "MEX", group_letter: "A", flag_url: flag("mx") },
  { id: "south-africa", name: "South Africa", code: "RSA", group_letter: "A", flag_url: flag("za") },
  { id: "korea-republic", name: "Korea Republic", code: "KOR", group_letter: "A", flag_url: flag("kr") },
  { id: "czechia", name: "Czechia", code: "CZE", group_letter: "A", flag_url: flag("cz") },
  { id: "canada", name: "Canada", code: "CAN", group_letter: "B", flag_url: flag("ca") },
  { id: "qatar", name: "Qatar", code: "QAT", group_letter: "B", flag_url: flag("qa") },
  { id: "switzerland", name: "Switzerland", code: "SUI", group_letter: "B", flag_url: flag("ch") },
  { id: "bosnia-herzegovina", name: "Bosnia and Herzegovina", code: "BIH", group_letter: "B", flag_url: flag("ba") },
  { id: "brazil", name: "Brazil", code: "BRA", group_letter: "C", flag_url: flag("br") },
  { id: "morocco", name: "Morocco", code: "MAR", group_letter: "C", flag_url: flag("ma") },
  { id: "haiti", name: "Haiti", code: "HAI", group_letter: "C", flag_url: flag("ht") },
  { id: "scotland", name: "Scotland", code: "SCO", group_letter: "C", flag_url: "https://flagcdn.com/gb-sct.svg" },
  { id: "usa", name: "United States", code: "USA", group_letter: "D", flag_url: flag("us") },
  { id: "paraguay", name: "Paraguay", code: "PAR", group_letter: "D", flag_url: flag("py") },
  { id: "australia", name: "Australia", code: "AUS", group_letter: "D", flag_url: flag("au") },
  { id: "turkiye", name: "Turkiye", code: "TUR", group_letter: "D", flag_url: flag("tr") },
  { id: "germany", name: "Germany", code: "GER", group_letter: "E", flag_url: flag("de") },
  { id: "curacao", name: "Curacao", code: "CUW", group_letter: "E", flag_url: flag("cw") },
  { id: "cote-divoire", name: "Cote d'Ivoire", code: "CIV", group_letter: "E", flag_url: flag("ci") },
  { id: "ecuador", name: "Ecuador", code: "ECU", group_letter: "E", flag_url: flag("ec") },
  { id: "netherlands", name: "Netherlands", code: "NED", group_letter: "F", flag_url: flag("nl") },
  { id: "japan", name: "Japan", code: "JPN", group_letter: "F", flag_url: flag("jp") },
  { id: "sweden", name: "Sweden", code: "SWE", group_letter: "F", flag_url: flag("se") },
  { id: "tunisia", name: "Tunisia", code: "TUN", group_letter: "F", flag_url: flag("tn") },
  { id: "belgium", name: "Belgium", code: "BEL", group_letter: "G", flag_url: flag("be") },
  { id: "egypt", name: "Egypt", code: "EGY", group_letter: "G", flag_url: flag("eg") },
  { id: "iran", name: "IR Iran", code: "IRN", group_letter: "G", flag_url: flag("ir") },
  { id: "new-zealand", name: "New Zealand", code: "NZL", group_letter: "G", flag_url: flag("nz") },
  { id: "spain", name: "Spain", code: "ESP", group_letter: "H", flag_url: flag("es") },
  { id: "cabo-verde", name: "Cabo Verde", code: "CPV", group_letter: "H", flag_url: flag("cv") },
  { id: "saudi-arabia", name: "Saudi Arabia", code: "KSA", group_letter: "H", flag_url: flag("sa") },
  { id: "uruguay", name: "Uruguay", code: "URU", group_letter: "H", flag_url: flag("uy") },
  { id: "france", name: "France", code: "FRA", group_letter: "I", flag_url: flag("fr") },
  { id: "senegal", name: "Senegal", code: "SEN", group_letter: "I", flag_url: flag("sn") },
  { id: "iraq", name: "Iraq", code: "IRQ", group_letter: "I", flag_url: flag("iq") },
  { id: "norway", name: "Norway", code: "NOR", group_letter: "I", flag_url: flag("no") },
  { id: "argentina", name: "Argentina", code: "ARG", group_letter: "J", flag_url: flag("ar") },
  { id: "algeria", name: "Algeria", code: "ALG", group_letter: "J", flag_url: flag("dz") },
  { id: "austria", name: "Austria", code: "AUT", group_letter: "J", flag_url: flag("at") },
  { id: "jordan", name: "Jordan", code: "JOR", group_letter: "J", flag_url: flag("jo") },
  { id: "portugal", name: "Portugal", code: "POR", group_letter: "K", flag_url: flag("pt") },
  { id: "congo-dr", name: "Congo DR", code: "COD", group_letter: "K", flag_url: flag("cd") },
  { id: "uzbekistan", name: "Uzbekistan", code: "UZB", group_letter: "K", flag_url: flag("uz") },
  { id: "colombia", name: "Colombia", code: "COL", group_letter: "K", flag_url: flag("co") },
  { id: "england", name: "England", code: "ENG", group_letter: "L", flag_url: "https://flagcdn.com/gb-eng.svg" },
  { id: "croatia", name: "Croatia", code: "CRO", group_letter: "L", flag_url: flag("hr") },
  { id: "ghana", name: "Ghana", code: "GHA", group_letter: "L", flag_url: flag("gh") },
  { id: "panama", name: "Panama", code: "PAN", group_letter: "L", flag_url: flag("pa") }
];

export const defaultScoringRules = {
  correct_qualified_team: 3,
  correct_group_winner: 5,
  correct_group_runner_up: 3,
  correct_third_place_qualifier: 2,
  correct_finalist: 8,
  correct_champion: 15
};

export function teamsByGroup(teams: Team[]) {
  return GROUP_LETTERS.reduce(
    (acc, group) => {
      acc[group] = teams.filter((team) => team.group_letter === group);
      return acc;
    },
    {} as Record<GroupLetter, Team[]>
  );
}

export function teamName(teams: Team[], teamId?: string) {
  if (!teamId) return "Not selected";
  return teams.find((team) => team.id === teamId)?.name ?? teamId;
}

export function qualifiedTeamIds(prediction: {
  groups: Record<GroupLetter, { winner: string; runnerUp: string }>;
  bestThirdPlace: string[];
}) {
  const groupQualified = GROUP_LETTERS.flatMap((group) => [
    prediction.groups[group]?.winner,
    prediction.groups[group]?.runnerUp
  ]).filter(Boolean);

  return Array.from(new Set([...groupQualified, ...prediction.bestThirdPlace]));
}
