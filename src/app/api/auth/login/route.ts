import { NextResponse } from "next/server";
import { loginSchema } from "@/server/validations/auth";
import { enforceRateLimit, getClientAddress, login, sessionLifetimeSeconds } from "@/server/services/auth.service";
import { setSessionCookie } from "@/server/utils/auth-cookie";
import { errorResponse, readJson } from "@/server/utils/api-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await readJson(request));
    const address = getClientAddress(request);
    if (address !== "unknown") {
      await enforceRateLimit("login-ip", address, 20, 15 * 60 * 1000);
    }
    await enforceRateLimit("login-email", input.email, 5, 15 * 60 * 1000);

    const result = await login(input);
    const response = NextResponse.json({
      success: true,
      data: { user: result.user },
    });
    setSessionCookie(response, result.token, sessionLifetimeSeconds());
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
