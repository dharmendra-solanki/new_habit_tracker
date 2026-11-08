import "server-only";
import { cookies } from "next/headers";
import { getSessionUser } from "@/server/services/auth.service";
import { SESSION_COOKIE_NAME } from "@/server/utils/auth-cookie";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  return getSessionUser(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}
