import { NextResponse } from "next/server";
import { aiService } from "@/server/services/ai.service";
import { errorResponse, readJson } from "@/server/utils/api-response";
import { getCurrentUser } from "@/server/utils/current-user";
import { recoveryPlanSchema } from "@/server/validations/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const { habitId } = recoveryPlanSchema.parse(await readJson(request));
    const result = await aiService.recoveryPlan(user.id, habitId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
