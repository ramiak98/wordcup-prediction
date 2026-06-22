import { z } from "zod";
import { GROUP_LETTERS } from "@/lib/types";

const groupPredictionSchema = z
  .object({
    winner: z.string().min(1),
    runnerUp: z.string().min(1),
    thirdPlace: z.string().optional()
  })
  .superRefine((value, ctx) => {
    const selected = [value.winner, value.runnerUp, value.thirdPlace].filter(
      Boolean
    );
    if (new Set(selected).size !== selected.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A team can only be selected once in the same group."
      });
    }
  });

export const predictionSchema = z.object({
  groups: z.object(
    Object.fromEntries(
      GROUP_LETTERS.map((group) => [group, groupPredictionSchema])
    ) as Record<(typeof GROUP_LETTERS)[number], typeof groupPredictionSchema>
  ),
  bestThirdPlace: z.array(z.string()).length(8),
  knockout: z
    .object({
      champion: z.string().optional(),
      finalist: z.string().optional(),
      semiFinalists: z.array(z.string()).max(4).optional()
    })
    .optional()
});

export const createPredictionSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name."),
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address."),
  vote_token: z
    .string()
    .trim()
    .uuid("Refresh the page and try submitting again."),
  predictions: predictionSchema
});

export const actualResultsSchema = z.object({
  groupWinners: z.record(z.string(), z.string().optional()),
  groupRunnerUps: z.record(z.string(), z.string().optional()),
  thirdPlaceQualifiers: z.array(z.string()),
  finalists: z.array(z.string()).max(2),
  champion: z.string().optional()
});

export const scoringRulesSchema = z.record(
  z.string(),
  z.coerce.number().int().min(0).max(100)
);
