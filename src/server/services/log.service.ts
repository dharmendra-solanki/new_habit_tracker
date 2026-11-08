import "server-only";
import { logRepository } from "@/server/repositories/log.repository";
import { AppError } from "@/server/utils/app-error";
import {
  completionStreaks,
  dateKeysInRange,
  parseDateKey,
  recentDateKeys,
  todayDateKey,
  toDateKey,
} from "@/server/utils/dates";

export const logService = {
  async markComplete(
    userId: string,
    habitId: string,
    dateKey: string | undefined,
    notes: string | undefined,
  ) {
    const completedDate = parseDateKey(dateKey ?? todayDateKey());
    if (completedDate > parseDateKey(todayDateKey())) {
      throw new AppError("Completions cannot be recorded for a future date.", 400);
    }
    const result = await logRepository.upsertForOwnedHabit(
      userId,
      habitId,
      completedDate,
      notes ?? "",
    );
    if (!result) {
      throw new AppError("Habit not found.", 404);
    }
    return result;
  },

  async unmarkComplete(userId: string, habitId: string, dateKey: string) {
    const habit = await logRepository.findOwnedHabit(userId, habitId);
    if (!habit) {
      throw new AppError("Habit not found.", 404);
    }
    await logRepository.deleteForOwnedHabit(
      userId,
      habitId,
      parseDateKey(dateKey),
    );
  },

  today(userId: string) {
    return logRepository.listByUserAndDate(
      userId,
      parseDateKey(todayDateKey()),
    );
  },

  range(userId: string, start: string, end: string) {
    return logRepository.listByUserInRange(
      userId,
      parseDateKey(start),
      parseDateKey(end),
    );
  },

  async heatmap(userId: string) {
    const days = recentDateKeys(90);
    const logs = await logRepository.listByUserInRange(
      userId,
      parseDateKey(days[0]),
      parseDateKey(days[days.length - 1]),
    );
    const counts = new Map<string, number>();
    for (const log of logs) {
      const date = toDateKey(log.completedDate);
      counts.set(date, (counts.get(date) ?? 0) + 1);
    }
    return days.map((date) => ({ date, count: counts.get(date) ?? 0 }));
  },

  async habitStats(userId: string, habitId: string) {
    const habit = await logRepository.findOwnedHabit(userId, habitId);
    if (!habit) {
      throw new AppError("Habit not found.", 404);
    }

    const logs = await logRepository.listByUserAndHabit(userId, habitId);
    const dates = logs.map((log) => toDateKey(log.completedDate));
    const streaks = completionStreaks(dates, todayDateKey());
    const createdDate = parseDateKey(toDateKey(habit.createdAt));
    const today = parseDateKey(todayDateKey());
    const totalDays =
      Math.floor((today.getTime() - createdDate.getTime()) / 86_400_000) + 1;
    const monthly: Record<string, number> = {};
    for (const date of dates) {
      const month = date.slice(0, 7);
      monthly[month] = (monthly[month] ?? 0) + 1;
    }

    return {
      habit,
      totalCompletions: dates.length,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      completionRate: Math.round((dates.length / Math.max(1, totalDays)) * 100),
      monthly,
    };
  },

  async allStats(userId: string) {
    const days = recentDateKeys(30);
    const habits = await logRepository.listActiveHabits(userId);
    const logs = await logRepository.listActiveHabitLogDates(
      userId,
      habits.map((habit) => habit.id),
    );
    const cutoff = parseDateKey(days[0]);
    const daySet = new Set(days);
    const logsByHabit = new Map<string, string[]>();
    const completionsByHabit30d = new Map<string, number>();

    for (const log of logs) {
      const date = toDateKey(log.completedDate);
      const habitDates = logsByHabit.get(log.habitId) ?? [];
      habitDates.push(date);
      logsByHabit.set(log.habitId, habitDates);

      if (log.completedDate >= cutoff && daySet.has(date)) {
        completionsByHabit30d.set(
          log.habitId,
          (completionsByHabit30d.get(log.habitId) ?? 0) + 1,
        );
      }
    }

    const today = todayDateKey();
    const perHabit = habits.map((habit) => {
      const streaks = completionStreaks(
        logsByHabit.get(habit.id) ?? [],
        today,
      );
      return {
        habitId: habit.id,
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        category: habit.category,
        completions30d: completionsByHabit30d.get(habit.id) ?? 0,
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
      };
    });

    return { perHabit, days };
  },

  rangeDays(start: string, end: string) {
    return dateKeysInRange(start, end);
  },
};
