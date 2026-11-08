import { describe, expect, it } from "vitest";
import {
  completionDateParamSchema,
  completionSchema,
  habitIdParamSchema,
  logRangeQuerySchema,
} from "@/server/validations/log";

describe("completion and log query validation", () => {
  it("accepts valid date keys and completion notes", () => {
    expect(completionDateParamSchema.parse("2024-02-29")).toBe("2024-02-29");
    expect(
      completionSchema.parse({
        date: "2024-02-29",
        notes: "  Felt good ",
      }),
    ).toEqual({ date: "2024-02-29", notes: "Felt good" });
  });

  it("rejects malformed or impossible calendar dates", () => {
    for (const date of ["2024-2-09", "2023-02-29", "2024-13-01", "date"]) {
      expect(completionDateParamSchema.safeParse(date).success).toBe(false);
    }
  });

  it("requires a valid ordered range no longer than 366 days", () => {
    expect(
      logRangeQuerySchema.safeParse({
        start: "2024-01-01",
        end: "2024-12-31",
      }).success,
    ).toBe(true);
    expect(
      logRangeQuerySchema.safeParse({
        start: "2024-02-01",
        end: "2024-01-01",
      }).success,
    ).toBe(false);
    expect(
      logRangeQuerySchema.safeParse({
        start: "2023-01-01",
        end: "2024-01-02",
      }).success,
    ).toBe(false);
  });

  it("rejects unknown payload fields and malformed habit IDs", () => {
    expect(
      completionSchema.safeParse({
        date: "2024-01-01",
        userId: "another-user",
      }).success,
    ).toBe(false);
    expect(habitIdParamSchema.safeParse("not-a-cuid").success).toBe(false);
  });
});
