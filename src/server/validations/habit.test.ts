import { describe, expect, it } from "vitest";
import {
  archiveHabitSchema,
  createHabitSchema,
  habitIdSchema,
  habitsQuerySchema,
  reorderHabitsSchema,
  updateHabitSchema,
} from "@/server/validations/habit";

describe("habit request validation", () => {
  it("trims habit fields and accepts supported categories and frequencies", () => {
    expect(
      createHabitSchema.parse({
        name: "  Morning walk ",
        description: "  Get outside ",
        category: "FITNESS",
        frequency: "DAILY",
      }),
    ).toEqual({
      name: "Morning walk",
      description: "Get outside",
      category: "FITNESS",
      frequency: "DAILY",
    });
  });

  it("rejects invalid names, category values, colors, and target days", () => {
    for (const input of [
      { name: " " },
      { name: "Walk", category: "UNKNOWN" },
      { name: "Walk", color: "red" },
      { name: "Walk", targetDays: 8 },
      { name: "Walk", targetDays: 1.5 },
    ]) {
      expect(createHabitSchema.safeParse(input).success).toBe(false);
    }
  });

  it("rejects unknown fields and empty updates", () => {
    expect(
      createHabitSchema.safeParse({ name: "Walk", userId: "another-user" })
        .success,
    ).toBe(false);
    expect(updateHabitSchema.safeParse({}).success).toBe(false);
  });

  it("validates archive state, query values, and habit IDs", () => {
    expect(archiveHabitSchema.safeParse({ isArchived: true }).success).toBe(
      true,
    );
    expect(archiveHabitSchema.safeParse({ isArchived: "true" }).success).toBe(
      false,
    );
    expect(habitsQuerySchema.parse({}).includeArchived).toBe("false");
    expect(habitsQuerySchema.safeParse({ includeArchived: "yes" }).success).toBe(
      false,
    );
    expect(habitIdSchema.safeParse("not-a-cuid").success).toBe(false);
  });

  it("rejects duplicate or invalid IDs in reorder requests", () => {
    expect(
      reorderHabitsSchema.safeParse({ order: ["ck8g7v7ax0000k3g5m1n3p2qz"] })
        .success,
    ).toBe(true);
    expect(
      reorderHabitsSchema.safeParse({
        order: [
          "ck8g7v7ax0000k3g5m1n3p2qz",
          "ck8g7v7ax0000k3g5m1n3p2qz",
        ],
      }).success,
    ).toBe(false);
    expect(reorderHabitsSchema.safeParse({ order: ["invalid"] }).success).toBe(
      false,
    );
  });
});
