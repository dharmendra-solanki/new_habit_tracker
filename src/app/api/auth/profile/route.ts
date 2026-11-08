import { NextResponse } from "next/server";
import { updateProfile } from "@/server/services/auth.service";
import { profileSchema } from "@/server/validations/auth";
import { getCurrentUser } from "@/server/utils/current-user";
import { errorResponse, readJson } from "@/server/utils/api-response";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const input = profileSchema.parse(await readJson(request));
    const user = await updateProfile(currentUser.id, input);
    return NextResponse.json({ success: true, data: { user } });
  } catch (error) {
    return errorResponse(error);
  }
}
