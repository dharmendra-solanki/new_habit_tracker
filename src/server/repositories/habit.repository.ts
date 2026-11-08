import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateHabitInput,
  UpdateHabitInput,
} from "@/server/validations/habit";

export const habitRepository = {
  listByUser(userId: string, includeArchived: boolean) {
    return prisma.habit.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  },

  createForUser(userId: string, input: CreateHabitInput) {
    return prisma.$transaction(async (transaction) => {
      const sortOrder = await transaction.habit.count({
        where: { userId },
      });

      return transaction.habit.create({
        data: {
          ...input,
          userId,
          sortOrder,
        },
      });
    });
  },

  async updateForUser(
    userId: string,
    habitId: string,
    input: UpdateHabitInput,
  ) {
    return prisma.$transaction(async (transaction) => {
      const result = await transaction.habit.updateMany({
        where: { id: habitId, userId },
        data: input,
      });

      if (result.count === 0) {
        return null;
      }

      return transaction.habit.findUnique({
        where: { id: habitId },
      });
    });
  },

  async setArchivedForUser(
    userId: string,
    habitId: string,
    isArchived: boolean,
  ) {
    return prisma.$transaction(async (transaction) => {
      const result = await transaction.habit.updateMany({
        where: { id: habitId, userId },
        data: { isArchived },
      });

      if (result.count === 0) {
        return null;
      }

      return transaction.habit.findUnique({
        where: { id: habitId },
      });
    });
  },

  async toggleArchivedForUser(userId: string, habitId: string) {
    return prisma.$transaction(async (transaction) => {
      const [habit] = await transaction.$queryRaw<
        { id: string; isArchived: boolean }[]
      >(
        Prisma.sql`
          SELECT "id", "isArchived"
          FROM "Habit"
          WHERE "id" = ${habitId} AND "userId" = ${userId}
          FOR UPDATE
        `,
      );

      if (!habit) {
        return null;
      }

      return transaction.habit.update({
        where: { id: habit.id },
        data: { isArchived: !habit.isArchived },
      });
    });
  },

  deleteForUser(userId: string, habitId: string) {
    return prisma.habit.deleteMany({
      where: { id: habitId, userId },
    });
  },

  async reorderForUser(userId: string, habitIds: string[]) {
    return prisma.$transaction(async (transaction) => {
      const ownedHabits = await transaction.habit.findMany({
        where: {
          userId,
          id: { in: habitIds },
        },
        select: { id: true },
      });

      if (ownedHabits.length !== habitIds.length) {
        return false;
      }

      await Promise.all(
        habitIds.map((id, sortOrder) =>
          transaction.habit.updateMany({
            where: { id, userId },
            data: { sortOrder },
          }),
        ),
      );

      return true;
    });
  },
};
