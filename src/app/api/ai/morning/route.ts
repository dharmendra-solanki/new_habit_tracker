import { NextResponse } from "next/server";
import { aiService } from "@/server/services/ai.service";
import { errorResponse } from "@/server/utils/api-response";
import { getCurrentUser } from "@/server/utils/current-user";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const result = await aiService.morningMotivation(user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
