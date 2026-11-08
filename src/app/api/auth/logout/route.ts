import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/server/utils/auth-cookie";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    data: { message: "Logged out." },
  });
  clearSessionCookie(response);
  return response;
}
