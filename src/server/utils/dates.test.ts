import { describe, expect, it } from "vitest";
import {
  completionStreaks,
  dateKeysInRange,
  parseDateKey,
  recentDateKeys,
  toDateKey,
} from "@/server/utils/dates";

describe("UTC completion date helpers", () => {
  it("rejects impossible dates and normalizes valid date keys to UTC midnight", () => {
    expect(() => parseDateKey("2023-02-29")).toThrow();
    expect(toDateKey(parseDateKey("2024-02-29"))).toBe("2024-02-29");
  });

  it("creates inclusive, sequential date ranges", () => {
    expect(dateKeysInRange("2024-03-01", "2024-03-03")).toEqual([
      "2024-03-01",
      "2024-03-02",
      "2024-03-03",
    ]);
    expect(recentDateKeys(3, new Date("2024-03-03T23:59:00Z"))).toEqual([
      "2024-03-01",
      "2024-03-02",
      "2024-03-03",
    ]);
  });

  it("counts a current streak through today or yesterday and keeps longest history", () => {
    expect(
      completionStreaks(
        ["2024-03-01", "2024-03-02", "2024-03-03"],
        "2024-03-03",
      ),
    ).toEqual({ current: 3, longest: 3 });
    expect(
      completionStreaks(
        ["2024-03-01", "2024-03-02"],
        "2024-03-03",
      ),
    ).toEqual({ current: 2, longest: 2 });
  });

  it("resets a broken current streak while retaining the historical best", () => {
    expect(
      completionStreaks(
        ["2024-02-01", "2024-02-02", "2024-03-01"],
        "2024-03-03",
      ),
    ).toEqual({ current: 0, longest: 2 });
  });
});
