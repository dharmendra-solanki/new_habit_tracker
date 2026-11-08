import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/utils/current-user";
import { errorResponse } from "@/server/utils/api-response";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ success: true, data: { user } });
  } catch (error) {
    return errorResponse(error);
  }
}
