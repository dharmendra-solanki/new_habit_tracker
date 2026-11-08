import { NextResponse } from "next/server";
import { habitService } from "@/server/services/habit.service";
import { getCurrentUser } from "@/server/utils/current-user";
import { errorResponse, readJson } from "@/server/utils/api-response";
import {
  createHabitSchema,
  habitsQuerySchema,
} from "@/server/validations/habit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const url = new URL(request.url);
    const query = habitsQuerySchema.parse({
      includeArchived: url.searchParams.get("includeArchived") ?? "false",
    });
    const habits = await habitService.list(
      user.id,
      query.includeArchived === "true",
    );
    return NextResponse.json({ success: true, data: { habits } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const input = createHabitSchema.parse(await readJson(request));
    const habit = await habitService.create(user.id, input);
    return NextResponse.json(
      { success: true, data: { habit } },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
