import { NextResponse } from "next/server";
import { logService } from "@/server/services/log.service";
import { errorResponse } from "@/server/utils/api-response";
import { getCurrentUser } from "@/server/utils/current-user";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const days = await logService.heatmap(user.id);
    return NextResponse.json({ success: true, data: { days } });
  } catch (error) {
    return errorResponse(error);
  }
}
