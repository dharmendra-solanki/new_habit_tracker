import "server-only";
import { prisma } from "@/lib/prisma";
import type { HabitLog } from "@/generated/prisma/client";

export const logRepository = {
  listByUserAndDate(userId: string, completedDate: Date) {
    return prisma.habitLog.findMany({
      where: {
        completedDate,
        habit: { userId },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
  },

  listByUserInRange(userId: string, start: Date, end: Date) {
    return prisma.habitLog.findMany({
      where: {
        completedDate: { gte: start, lte: end },
        habit: { userId },
      },
      orderBy: [{ completedDate: "asc" }, { createdAt: "asc" }],
    });
  },

  listByUserAndHabit(userId: string, habitId: string) {
    return prisma.habitLog.findMany({
      where: {
        habitId,
        habit: { userId },
      },
      orderBy: { completedDate: "asc" },
      select: { completedDate: true },
    });
  },

  listActiveHabits(userId: string) {
    return prisma.habit.findMany({
      where: { userId, isArchived: false },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  },

  async listRangeForActiveHabits(userId: string, start: Date, end: Date) {
    return prisma.habitLog.findMany({
      where: {
        completedDate: { gte: start, lte: end },
        habit: { userId, isArchived: false },
      },
    });
  },

  async listActiveHabitLogDates(userId: string, habitIds: string[]) {
    return prisma.habitLog.findMany({
      where: {
        habitId: { in: habitIds },
        habit: { userId, isArchived: false },
      },
      select: { habitId: true, completedDate: true },
      orderBy: { completedDate: "asc" },
    });
  },

  listAllActiveHabitLogs(userId: string, habitIds: string[]) {
    return prisma.habitLog.findMany({
      where: {
        habitId: { in: habitIds },
        habit: { userId, isArchived: false },
      },
      select: { habitId: true, completedDate: true },
      orderBy: { completedDate: "asc" },
    });
  },

  async findOwnedHabit(userId: string, habitId: string) {
    return prisma.habit.findFirst({
      where: { id: habitId, userId },
    });
  },

  async upsertForOwnedHabit(
    userId: string,
    habitId: string,
    completedDate: Date,
    notes: string,
  ): Promise<{ log: HabitLog; created: boolean } | null> {
    return prisma.$transaction(async (transaction) => {
      const habit = await transaction.habit.findFirst({
        where: { id: habitId, userId },
        select: { id: true },
      });
      if (!habit) {
        return null;
      }

      const existing = await transaction.habitLog.findUnique({
        where: {
          habitId_completedDate: { habitId, completedDate },
        },
      });
      const log = await transaction.habitLog.upsert({
        where: {
          habitId_completedDate: { habitId, completedDate },
        },
        create: { habitId, completedDate, notes },
        update: notes ? { notes } : {},
      });
      return { log, created: existing === null };
    });
  },

  deleteForOwnedHabit(
    userId: string,
    habitId: string,
    completedDate: Date,
  ) {
    return prisma.habitLog.deleteMany({
      where: {
        habitId,
        completedDate,
        habit: { userId },
      },
    });
  },
};
