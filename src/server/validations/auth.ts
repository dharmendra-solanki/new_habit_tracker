import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .refine(
    (password) => new TextEncoder().encode(password).length <= 72,
    "Password must not exceed 72 bytes.",
  );

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z
      .string()
      .min(1)
      .refine(
        (password) => new TextEncoder().encode(password).length <= 72,
        "Password must not exceed 72 bytes.",
      ),
  })
  .strict();

export const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
    currentPassword: z.string().min(1).max(72).optional(),
    morningMotivation: z.boolean().optional(),
  })
  .strict()
  .refine(
    ({ name, email, password, currentPassword, morningMotivation }) =>
      name !== undefined ||
      email !== undefined ||
      password !== undefined ||
      currentPassword !== undefined ||
      morningMotivation !== undefined,
    "At least one profile field is required.",
  )
  .refine(
    ({ email, password, currentPassword }) =>
      (email === undefined && password === undefined) ||
      currentPassword !== undefined,
    {
      message: "Current password is required to change email or password.",
      path: ["currentPassword"],
    },
  );

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
