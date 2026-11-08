import { AppError } from "@/server/utils/app-error";

const DAY_MILLISECONDS = 86_400_000;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDateKey(value: string): Date {
  if (!DATE_KEY_PATTERN.test(value)) {
    throw new AppError("Date must use YYYY-MM-DD format.", 400);
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new AppError("Date must be a valid calendar date.", 400);
  }
  return date;
}

export function todayDateKey(now = new Date()): string {
  return toDateKey(now);
}

export function addDays(date: Date, amount: number): Date {
  return new Date(date.getTime() + amount * DAY_MILLISECONDS);
}

export function dateKeysInRange(start: string, end: string): string[] {
  const first = parseDateKey(start);
  const last = parseDateKey(end);
  if (first > last) {
    throw new AppError("Start date must be on or before end date.", 400);
  }

  const keys: string[] = [];
  for (let cursor = first; cursor <= last; cursor = addDays(cursor, 1)) {
    keys.push(toDateKey(cursor));
  }
  return keys;
}

export function recentDateKeys(days: number, now = new Date()): string[] {
  const end = parseDateKey(todayDateKey(now));
  return dateKeysInRange(
    toDateKey(addDays(end, -(days - 1))),
    toDateKey(end),
  );
}

export function completionStreaks(dateKeys: string[], today: string) {
  const completed = new Set(dateKeys);
  const yesterday = toDateKey(addDays(parseDateKey(today), -1));
  let current = 0;
  let cursor = completed.has(today) ? today : yesterday;

  if (completed.has(cursor)) {
    while (completed.has(cursor)) {
      current += 1;
      cursor = toDateKey(addDays(parseDateKey(cursor), -1));
    }
  }

  let longest = 0;
  let run = 0;
  let previous: string | undefined;
  for (const date of [...completed].sort()) {
    if (
      previous !== undefined &&
      parseDateKey(date).getTime() - parseDateKey(previous).getTime() ===
        DAY_MILLISECONDS
    ) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    previous = date;
  }

  return { current, longest };
}
