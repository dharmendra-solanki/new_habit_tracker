import { describe, expect, it } from "vitest";
import {
  habitChatSchema,
  habitSuggestionsInputSchema,
  recoveryPlanSchema,
  suggestionOutputSchema,
} from "@/server/validations/ai";

describe("AI request and response validation", () => {
  it("trims and defaults optional habit-suggestion context", () => {
    expect(
      habitSuggestionsInputSchema.parse({
        goals: "  Read more ",
        productiveTime: " mornings ",
      }),
    ).toEqual({
      goals: "Read more",
      productiveTime: "mornings",
      struggles: "",
    });
  });

  it("rejects oversized context, unknown fields, and empty chat questions", () => {
    expect(
      habitSuggestionsInputSchema.safeParse({ goals: "x".repeat(501) }).success,
    ).toBe(false);
    expect(
      habitSuggestionsInputSchema.safeParse({ role: "admin" }).success,
    ).toBe(false);
    expect(habitChatSchema.safeParse({ question: "  " }).success).toBe(false);
    expect(
      habitChatSchema.safeParse({ question: "x".repeat(501) }).success,
    ).toBe(false);
  });

  it("validates recovery habit IDs", () => {
    expect(
      recoveryPlanSchema.safeParse({
        habitId: "ck8g7v7ax0000k3g5m1n3p2qz",
      }).success,
    ).toBe(true);
    expect(recoveryPlanSchema.safeParse({ habitId: "another-user" }).success).toBe(
      false,
    );
  });

  it("requires exactly three well-formed suggestions", () => {
    const suggestion = {
      name: "Read five pages",
      description: "Read five pages after breakfast.",
      frequency: "DAILY",
      category: "LEARNING",
      icon: "📚",
      reason: "A small repeatable step makes reading easier to sustain.",
    };
    expect(
      suggestionOutputSchema.safeParse({
        suggestions: [suggestion, suggestion, suggestion],
      }).success,
    ).toBe(true);
    expect(
      suggestionOutputSchema.safeParse({
        suggestions: [suggestion, suggestion],
      }).success,
    ).toBe(false);
    expect(
      suggestionOutputSchema.safeParse({
        suggestions: [
          { ...suggestion, category: "UNKNOWN" },
          suggestion,
          suggestion,
        ],
      }).success,
    ).toBe(false);
  });
});
