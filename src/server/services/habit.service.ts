import "server-only";
import { habitRepository } from "@/server/repositories/habit.repository";
import { AppError } from "@/server/utils/app-error";
import type {
  CreateHabitInput,
  UpdateHabitInput,
} from "@/server/validations/habit";

export const habitService = {
  list(userId: string, includeArchived: boolean) {
    return habitRepository.listByUser(userId, includeArchived);
  },

  create(userId: string, input: CreateHabitInput) {
    return habitRepository.createForUser(userId, input);
  },

  async update(userId: string, habitId: string, input: UpdateHabitInput) {
    const habit = await habitRepository.updateForUser(userId, habitId, input);
    if (!habit) {
      throw new AppError("Habit not found.", 404);
    }
    return habit;
  },

  async setArchived(
    userId: string,
    habitId: string,
    isArchived: boolean,
  ) {
    const habit = await habitRepository.setArchivedForUser(
      userId,
      habitId,
      isArchived,
    );
    if (!habit) {
      throw new AppError("Habit not found.", 404);
    }
    return habit;
  },

  async toggleArchived(userId: string, habitId: string) {
    const habit = await habitRepository.toggleArchivedForUser(userId, habitId);
    if (!habit) {
      throw new AppError("Habit not found.", 404);
    }
    return habit;
  },

  async delete(userId: string, habitId: string) {
    const result = await habitRepository.deleteForUser(userId, habitId);
    if (result.count === 0) {
      throw new AppError("Habit not found.", 404);
    }
  },

  async reorder(userId: string, habitIds: string[]) {
    const reordered = await habitRepository.reorderForUser(userId, habitIds);
    if (!reordered) {
      throw new AppError(
        "One or more habits were not found or do not belong to this account.",
        404,
      );
    }
  },
};
