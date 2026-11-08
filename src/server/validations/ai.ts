import { z } from "zod";

const optionalContext = z.string().trim().max(500).optional().default("");

export const weeklyReportSchema = z.object({}).strict();

export const habitSuggestionsInputSchema = z
  .object({
    goals: optionalContext,
    productiveTime: optionalContext,
    struggles: optionalContext,
  })
  .strict();

export const recoveryPlanSchema = z
  .object({
    habitId: z.string().cuid(),
  })
  .strict();

export const habitChatSchema = z
  .object({
    question: z.string().trim().min(1).max(500),
  })
  .strict();

export const suggestionOutputSchema = z
  .object({
    suggestions: z
      .array(
        z
          .object({
            name: z.string().trim().min(1).max(100),
            description: z.string().trim().min(1).max(500),
            frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
            category: z.enum([
              "HEALTH",
              "FITNESS",
              "LEARNING",
              "MINDFULNESS",
              "PRODUCTIVITY",
              "SOCIAL",
              "FINANCE",
              "CREATIVE",
              "OTHER",
            ]),
            icon: z.string().trim().min(1).max(16),
            reason: z.string().trim().min(1).max(300),
          })
          .strict(),
      )
      .length(3),
  })
  .strict();

export type HabitSuggestionsInput = z.infer<
  typeof habitSuggestionsInputSchema
>;
export type RecoveryPlanInput = z.infer<typeof recoveryPlanSchema>;
export type HabitChatInput = z.infer<typeof habitChatSchema>;
export type HabitSuggestion = z.infer<
  typeof suggestionOutputSchema
>["suggestions"][number];
