import { z } from "zod";

export const model = "sonar";

// For structured output
export const CodeReviewEvent = z.object({
  summary: z
    .string()
    .describe(
      "Overall summary of the code review highlighting key points and observations. Max 2 lines."
    ),
  overall_score: z
    .number()
    .describe("Overall quality score of the code out of 100")
    .min(0)
    .max(100),
});

// Check user input
export const InputGuardrailEvent = z.object({
  isCodeReview: z.boolean(),
  reasoning: z.string(),
});

// Check agent output
export const OutputGuardrailEvent = z.object({
  isSafe: z.boolean(),
  reasoning: z.string(),
});
