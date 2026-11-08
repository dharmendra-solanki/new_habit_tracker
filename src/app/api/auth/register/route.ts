import { NextResponse } from "next/server";
import { registerSchema } from "@/server/validations/auth";
import { register, enforceRateLimit, getClientAddress, sessionLifetimeSeconds } from "@/server/services/auth.service";
import { setSessionCookie } from "@/server/utils/auth-cookie";
import { errorResponse, readJson } from "@/server/utils/api-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = registerSchema.parse(await readJson(request));
    const address = getClientAddress(request);
    if (address !== "unknown") {
      await enforceRateLimit("register-ip", address, 5, 60 * 60 * 1000);
    }
    await enforceRateLimit("register-email", input.email, 3, 60 * 60 * 1000);

    const result = await register(input);
    const response = NextResponse.json(
      { success: true, data: { user: result.user } },
      { status: 201 },
    );
    setSessionCookie(response, result.token, sessionLifetimeSeconds());
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
