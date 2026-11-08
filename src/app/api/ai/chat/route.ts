import { NextResponse } from "next/server";
import { aiService } from "@/server/services/ai.service";
import { errorResponse, readJson } from "@/server/utils/api-response";
import { getCurrentUser } from "@/server/utils/current-user";
import { habitChatSchema } from "@/server/validations/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const input = habitChatSchema.parse(await readJson(request));
    const result = await aiService.chat(user.id, input);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
