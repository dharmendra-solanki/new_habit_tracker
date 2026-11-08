import { NextResponse } from "next/server";
import { aiService } from "@/server/services/ai.service";
import { errorResponse, readJson } from "@/server/utils/api-response";
import { getCurrentUser } from "@/server/utils/current-user";
import { weeklyReportSchema } from "@/server/validations/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    weeklyReportSchema.parse(await readJson(request, false));
    const report = await aiService.weeklyReport(user.id);
    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    return errorResponse(error);
  }
}
