import { NextResponse } from "next/server";
import { logService } from "@/server/services/log.service";
import { errorResponse } from "@/server/utils/api-response";
import { getCurrentUser } from "@/server/utils/current-user";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const logs = await logService.today(user.id);
    return NextResponse.json({ success: true, data: { logs } });
  } catch (error) {
    return errorResponse(error);
  }
}
