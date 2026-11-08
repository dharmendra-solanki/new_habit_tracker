import { NextResponse } from "next/server";
import { habitService } from "@/server/services/habit.service";
import { getCurrentUser } from "@/server/utils/current-user";
import { errorResponse, readJson } from "@/server/utils/api-response";
import {
  habitIdSchema,
  updateHabitSchema,
} from "@/server/validations/habit";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const habitId = habitIdSchema.parse(id);
    const input = updateHabitSchema.parse(await readJson(request));
    const habit = await habitService.update(user.id, habitId, input);
    return NextResponse.json({ success: true, data: { habit } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const habitId = habitIdSchema.parse(id);
    await habitService.delete(user.id, habitId);
    return NextResponse.json({
      success: true,
      data: { message: "Habit deleted successfully." },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
