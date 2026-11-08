import { z } from "zod";

const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format.")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Date must be a valid calendar date.");

export const habitIdParamSchema = z.string().cuid();

export const completionSchema = z
  .object({
    date: dateKeySchema.optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();

export const completionDateParamSchema = dateKeySchema;

export const logRangeQuerySchema = z
  .object({
    start: dateKeySchema,
    end: dateKeySchema,
  })
  .strict()
  .refine(
    ({ start, end }) =>
      start <= end &&
      (Date.parse(`${end}T00:00:00.000Z`) -
        Date.parse(`${start}T00:00:00.000Z`)) /
        86_400_000 <=
        365,
    {
      message: "Date range must be ordered and no longer than 366 days.",
      path: ["end"],
    },
  );
