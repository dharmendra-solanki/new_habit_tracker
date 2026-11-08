import { NextResponse } from "next/server";
import { logService } from "@/server/services/log.service";
import { errorResponse } from "@/server/utils/api-response";
import { getCurrentUser } from "@/server/utils/current-user";
import {
  completionDateParamSchema,
  habitIdParamSchema,
} from "@/server/validations/log";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ habitId: string; date: string }>;
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { habitId: rawHabitId, date: rawDate } = await params;
    const habitId = habitIdParamSchema.parse(rawHabitId);
    const date = completionDateParamSchema.parse(rawDate);
    await logService.unmarkComplete(user.id, habitId, date);
    return NextResponse.json({
      success: true,
      data: { message: "Marked incomplete." },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
