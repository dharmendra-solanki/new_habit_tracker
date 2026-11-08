import { NextResponse } from "next/server";
import { logService } from "@/server/services/log.service";
import { errorResponse, readJson } from "@/server/utils/api-response";
import { getCurrentUser } from "@/server/utils/current-user";
import {
  completionDateParamSchema,
  completionSchema,
  habitIdParamSchema,
} from "@/server/validations/log";
import { todayDateKey } from "@/server/utils/dates";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ habitId: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { habitId: rawHabitId } = await params;
    const habitId = habitIdParamSchema.parse(rawHabitId);
    const input = completionSchema.parse(await readJson(request, false));
    const result = await logService.markComplete(
      user.id,
      habitId,
      input.date,
      input.notes,
    );
    return NextResponse.json(
      {
        success: true,
        data: { log: result.log },
      },
      { status: result.created ? 201 : 200 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { habitId: rawHabitId } = await params;
    const habitId = habitIdParamSchema.parse(rawHabitId);
    const url = new URL(request.url);
    const rawDate = url.searchParams.get("date");
    const date = rawDate
      ? completionDateParamSchema.parse(rawDate)
      : todayDateKey();
    await logService.unmarkComplete(user.id, habitId, date);
    return NextResponse.json({
      success: true,
      data: { message: "Marked incomplete." },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
