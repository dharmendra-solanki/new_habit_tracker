import { NextResponse } from "next/server";
import { logService } from "@/server/services/log.service";
import { errorResponse } from "@/server/utils/api-response";
import { getCurrentUser } from "@/server/utils/current-user";
import { habitIdParamSchema } from "@/server/validations/log";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ habitId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { habitId: rawHabitId } = await params;
    const habitId = habitIdParamSchema.parse(rawHabitId);
    const stats = await logService.habitStats(user.id, habitId);
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return errorResponse(error);
  }
}
