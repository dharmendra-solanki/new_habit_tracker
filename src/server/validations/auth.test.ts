import { describe, expect, it } from "vitest";
import { loginSchema, profileSchema, registerSchema } from "@/server/validations/auth";

describe("authentication request validation", () => {
  it("trims names and normalizes email addresses during registration", () => {
    expect(
      registerSchema.parse({
        name: "  Alex Habit  ",
        email: "  ALEX@example.com ",
        password: "a-secure-password",
      }),
    ).toEqual({
      name: "Alex Habit",
      email: "alex@example.com",
      password: "a-secure-password",
    });
  });

  it("rejects passwords that are shorter than eight characters", () => {
    expect(
      registerSchema.safeParse({
        name: "Alex",
        email: "alex@example.com",
        password: "short",
      }).success,
    ).toBe(false);
  });

  it("rejects passwords longer than bcrypt's 72-byte limit", () => {
    expect(
      registerSchema.safeParse({
        name: "Alex",
        email: "alex@example.com",
        password: "é".repeat(37),
      }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({
        email: "alex@example.com",
        password: "é".repeat(37),
      }).success,
    ).toBe(false);
  });

  it("rejects unknown fields and empty profile updates", () => {
    expect(
      registerSchema.safeParse({
        name: "Alex",
        email: "alex@example.com",
        password: "a-secure-password",
        role: "admin",
      }).success,
    ).toBe(false);
    expect(profileSchema.safeParse({}).success).toBe(false);
  });

  it("requires the current password for email and password changes", () => {
    expect(
      profileSchema.safeParse({
        email: "new@example.com",
      }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({
        email: "new@example.com",
        currentPassword: "current-password",
      }).success,
    ).toBe(true);
  });
});
