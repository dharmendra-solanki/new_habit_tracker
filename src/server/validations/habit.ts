import { z } from "zod";

export const habitIdSchema = z.string().cuid();

const habitFields = {
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000),
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
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  targetDays: z.number().int().min(1).max(7),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().trim().min(1).max(16),
} satisfies z.ZodRawShape;

export const createHabitSchema = z
  .object(habitFields)
  .partial({
    description: true,
    category: true,
    frequency: true,
    targetDays: true,
    color: true,
    icon: true,
  })
  .strict();

export const updateHabitSchema = z
  .object({
    ...habitFields,
    sortOrder: z.number().int().min(0).max(1_000_000),
  })
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one habit field is required.",
  });

export const habitsQuerySchema = z
  .object({
    includeArchived: z.enum(["true", "false"]).default("false"),
  })
  .strict();

export const reorderHabitsSchema = z
  .object({
    order: z.array(habitIdSchema).max(500),
  })
  .strict()
  .refine(({ order }) => new Set(order).size === order.length, {
    message: "Habit IDs in the order must be unique.",
    path: ["order"],
  });

export const archiveHabitSchema = z
  .object({
    isArchived: z.boolean().optional(),
  })
  .strict();

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
