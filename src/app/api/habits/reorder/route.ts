import { NextResponse } from "next/server";
import { habitService } from "@/server/services/habit.service";
import { getCurrentUser } from "@/server/utils/current-user";
import { errorResponse, readJson } from "@/server/utils/api-response";
import { reorderHabitsSchema } from "@/server/validations/habit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const { order } = reorderHabitsSchema.parse(await readJson(request));
    await habitService.reorder(user.id, order);
    return NextResponse.json({
      success: true,
      data: { message: "Habits reordered successfully." },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
