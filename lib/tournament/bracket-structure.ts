import type { MatchRound } from "@/lib/types";

export type FeederSlot = {
  matchNumber: number;
  slot: "a" | "b";
  source: "winner" | "loser";
};

export type BracketTopology = {
  matchNumber: number;
  round: MatchRound;
  nextMatch: number | null;
  nextSlot: "a" | "b" | null;
  loserNextMatch: number | null;
  loserNextSlot: "a" | "b" | null;
  feeders: FeederSlot[];
};

/** Official FIFA bracket topology — match numbers and advancement paths only. */
export const BRACKET_TOPOLOGY: BracketTopology[] = [
  { matchNumber: 73, round: "round-of-32", nextMatch: 90, nextSlot: "a", loserNextMatch: null, loserNextSlot: null, feeders: [] },
  { matchNumber: 74, round: "round-of-32", nextMatch: 89, nextSlot: "a", loserNextMatch: null, loserNextSlot: null, feeders: [] },
  { matchNumber: 75, round: "round-of-32", nextMatch: 90, nextSlot: "b", loserNextMatch: null, loserNextSlot: null, feeders: [] },
  { matchNumber: 76, round: "round-of-32", nextMatch: 91, nextSlot: "a", loserNextMatch: null, loserNextSlot: null, feeders: [] },
  { matchNumber: 77, round: "round-of-32", nextMatch: 89, nextSlot: "b", loserNextMatch: null, loserNextSlot: null, feeders: [] },
  { matchNumber: 78, round: "round-of-32", nextMatch: 91, nextSlot: "b", loserNextMatch: null, loserNextSlot: null, feeders: [] },
  { matchNumber: 79, round: "round-of-32", nextMatch: 92, nextSlot: "a", loserNextMatch: null, loserNextSlot: null, feeders: [] },
  { matchNumber: 80, round: "round-of-32", nextMatch: 92, nextSlot: "b", loserNextMatch: null, loserNextSlot: null, feeders: [] },
  { matchNumber: 81, round: "round-of-32", nextMatch: 94, nextSlot: "a", loserNextMatch: null, loserNextSlot: null, feeders: [] },
  { matchNumber: 82, round: "round-of-32", nextMatch: 94, nextSlot: "b", loserNextMatch: null, loserNextSlot: null, feeders: [] },
  { matchNumber: 83, round: "round-of-32", nextMatch: 93, nextSlot: "a", loserNextMatch: null, loserNextSlot: null, feeders: [] },
  { matchNumber: 84, round: "round-of-32", nextMatch: 93, nextSlot: "b", loserNextMatch: null, loserNextSlot: null, feeders: [] },
  { matchNumber: 85, round: "round-of-32", nextMatch: 96, nextSlot: "a", loserNextMatch: null, loserNextSlot: null, feeders: [] },
  { matchNumber: 86, round: "round-of-32", nextMatch: 95, nextSlot: "a", loserNextMatch: null, loserNextSlot: null, feeders: [] },
  { matchNumber: 87, round: "round-of-32", nextMatch: 96, nextSlot: "b", loserNextMatch: null, loserNextSlot: null, feeders: [] },
  { matchNumber: 88, round: "round-of-32", nextMatch: 95, nextSlot: "b", loserNextMatch: null, loserNextSlot: null, feeders: [] },
  {
    matchNumber: 89,
    round: "round-of-16",
    nextMatch: 97,
    nextSlot: "a",
    loserNextMatch: null,
    loserNextSlot: null,
    feeders: [
      { matchNumber: 74, slot: "a", source: "winner" },
      { matchNumber: 77, slot: "b", source: "winner" }
    ]
  },
  {
    matchNumber: 90,
    round: "round-of-16",
    nextMatch: 97,
    nextSlot: "b",
    loserNextMatch: null,
    loserNextSlot: null,
    feeders: [
      { matchNumber: 73, slot: "a", source: "winner" },
      { matchNumber: 75, slot: "b", source: "winner" }
    ]
  },
  {
    matchNumber: 91,
    round: "round-of-16",
    nextMatch: 99,
    nextSlot: "a",
    loserNextMatch: null,
    loserNextSlot: null,
    feeders: [
      { matchNumber: 76, slot: "a", source: "winner" },
      { matchNumber: 78, slot: "b", source: "winner" }
    ]
  },
  {
    matchNumber: 92,
    round: "round-of-16",
    nextMatch: 99,
    nextSlot: "b",
    loserNextMatch: null,
    loserNextSlot: null,
    feeders: [
      { matchNumber: 79, slot: "a", source: "winner" },
      { matchNumber: 80, slot: "b", source: "winner" }
    ]
  },
  {
    matchNumber: 93,
    round: "round-of-16",
    nextMatch: 98,
    nextSlot: "a",
    loserNextMatch: null,
    loserNextSlot: null,
    feeders: [
      { matchNumber: 83, slot: "a", source: "winner" },
      { matchNumber: 84, slot: "b", source: "winner" }
    ]
  },
  {
    matchNumber: 94,
    round: "round-of-16",
    nextMatch: 98,
    nextSlot: "b",
    loserNextMatch: null,
    loserNextSlot: null,
    feeders: [
      { matchNumber: 81, slot: "a", source: "winner" },
      { matchNumber: 82, slot: "b", source: "winner" }
    ]
  },
  {
    matchNumber: 95,
    round: "round-of-16",
    nextMatch: 100,
    nextSlot: "a",
    loserNextMatch: null,
    loserNextSlot: null,
    feeders: [
      { matchNumber: 86, slot: "a", source: "winner" },
      { matchNumber: 88, slot: "b", source: "winner" }
    ]
  },
  {
    matchNumber: 96,
    round: "round-of-16",
    nextMatch: 100,
    nextSlot: "b",
    loserNextMatch: null,
    loserNextSlot: null,
    feeders: [
      { matchNumber: 85, slot: "a", source: "winner" },
      { matchNumber: 87, slot: "b", source: "winner" }
    ]
  },
  {
    matchNumber: 97,
    round: "quarter-finals",
    nextMatch: 101,
    nextSlot: "a",
    loserNextMatch: 103,
    loserNextSlot: "a",
    feeders: [
      { matchNumber: 89, slot: "a", source: "winner" },
      { matchNumber: 90, slot: "b", source: "winner" }
    ]
  },
  {
    matchNumber: 98,
    round: "quarter-finals",
    nextMatch: 101,
    nextSlot: "b",
    loserNextMatch: 103,
    loserNextSlot: "b",
    feeders: [
      { matchNumber: 93, slot: "a", source: "winner" },
      { matchNumber: 94, slot: "b", source: "winner" }
    ]
  },
  {
    matchNumber: 99,
    round: "quarter-finals",
    nextMatch: 102,
    nextSlot: "a",
    loserNextMatch: null,
    loserNextSlot: null,
    feeders: [
      { matchNumber: 91, slot: "a", source: "winner" },
      { matchNumber: 92, slot: "b", source: "winner" }
    ]
  },
  {
    matchNumber: 100,
    round: "quarter-finals",
    nextMatch: 102,
    nextSlot: "b",
    loserNextMatch: null,
    loserNextSlot: null,
    feeders: [
      { matchNumber: 95, slot: "a", source: "winner" },
      { matchNumber: 96, slot: "b", source: "winner" }
    ]
  },
  {
    matchNumber: 101,
    round: "semi-finals",
    nextMatch: 104,
    nextSlot: "a",
    loserNextMatch: 103,
    loserNextSlot: "a",
    feeders: [
      { matchNumber: 97, slot: "a", source: "winner" },
      { matchNumber: 98, slot: "b", source: "winner" }
    ]
  },
  {
    matchNumber: 102,
    round: "semi-finals",
    nextMatch: 104,
    nextSlot: "b",
    loserNextMatch: 103,
    loserNextSlot: "b",
    feeders: [
      { matchNumber: 99, slot: "a", source: "winner" },
      { matchNumber: 100, slot: "b", source: "winner" }
    ]
  },
  {
    matchNumber: 103,
    round: "third-place",
    nextMatch: null,
    nextSlot: null,
    loserNextMatch: null,
    loserNextSlot: null,
    feeders: [
      { matchNumber: 101, slot: "a", source: "loser" },
      { matchNumber: 102, slot: "b", source: "loser" }
    ]
  },
  {
    matchNumber: 104,
    round: "final",
    nextMatch: null,
    nextSlot: null,
    loserNextMatch: null,
    loserNextSlot: null,
    feeders: [
      { matchNumber: 101, slot: "a", source: "winner" },
      { matchNumber: 102, slot: "b", source: "winner" }
    ]
  }
];

export const TOPOLOGY_BY_MATCH = new Map(
  BRACKET_TOPOLOGY.map((entry) => [entry.matchNumber, entry])
);

export const ROUND_ORDER: MatchRound[] = [
  "round-of-32",
  "round-of-16",
  "quarter-finals",
  "semi-finals",
  "third-place",
  "final"
];

export function roundLabel(round: MatchRound) {
  const labels: Record<MatchRound, string> = {
    "round-of-32": "Round of 32",
    "round-of-16": "Round of 16",
    "quarter-finals": "Quarterfinals",
    "semi-finals": "Semifinals",
    "third-place": "Third Place",
    final: "Final"
  };
  return labels[round];
}
