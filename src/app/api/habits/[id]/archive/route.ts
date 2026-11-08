import { NextResponse } from "next/server";
import { habitService } from "@/server/services/habit.service";
import { getCurrentUser } from "@/server/utils/current-user";
import { errorResponse, readJson } from "@/server/utils/api-response";
import {
  archiveHabitSchema,
  habitIdSchema,
} from "@/server/validations/habit";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const habitId = habitIdSchema.parse(id);
    const body = archiveHabitSchema.parse(await readJson(request, false));
    const habit =
      body.isArchived === undefined
        ? await habitService.toggleArchived(user.id, habitId)
        : await habitService.setArchived(user.id, habitId, body.isArchived);
    return NextResponse.json({ success: true, data: { habit } });
  } catch (error) {
    return errorResponse(error);
  }
}
