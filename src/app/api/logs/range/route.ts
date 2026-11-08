import { NextResponse } from "next/server";
import { logService } from "@/server/services/log.service";
import { errorResponse } from "@/server/utils/api-response";
import { getCurrentUser } from "@/server/utils/current-user";
import { logRangeQuerySchema } from "@/server/validations/log";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const url = new URL(request.url);
    const range = logRangeQuerySchema.parse({
      start: url.searchParams.get("start"),
      end: url.searchParams.get("end"),
    });
    const logs = await logService.range(user.id, range.start, range.end);
    return NextResponse.json({ success: true, data: { logs } });
  } catch (error) {
    return errorResponse(error);
  }
}
