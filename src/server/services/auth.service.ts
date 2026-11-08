import "server-only";
import { createHmac } from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { authRepository } from "@/server/repositories/auth.repository";
import { AppError } from "@/server/utils/app-error";
import type {
  LoginInput,
  ProfileInput,
  RegisterInput,
} from "@/server/validations/auth";

const JWT_ALGORITHM = "HS256";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || new TextEncoder().encode(secret).length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

function getTokenLifetime() {
  const configuredLifetime = process.env.JWT_EXPIRES_IN ?? "30d";
  const match = /^(\d+)(s|m|h|d)$/.exec(configuredLifetime);
  if (!match) {
    throw new Error("JWT_EXPIRES_IN must be a duration such as 30d, 12h, or 60m.");
  }

  const amount = Number(match[1]);
  const multiplier =
    match[2] === "s"
      ? 1
      : match[2] === "m"
        ? 60
        : match[2] === "h"
          ? 3_600
          : 86_400;
  const seconds = amount * multiplier;
  if (!Number.isSafeInteger(seconds) || seconds < 1 || seconds > 365 * 86_400) {
    throw new Error("JWT_EXPIRES_IN must be between 1 second and 365 days.");
  }

  return seconds;
}

export const sessionLifetimeSeconds = getTokenLifetime;

async function createToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${getTokenLifetime()}s`)
    .sign(getSecret());
}

export async function register(input: RegisterInput) {
  const existingUser = await authRepository.findByEmail(input.email);
  if (existingUser) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await authRepository.createUser({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  return { user, token: await createToken(user.id) };
}

export async function login(input: LoginInput) {
  const user = await authRepository.findByEmail(input.email);
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError("Invalid email or password.", 401);
  }

  const { passwordHash: _passwordHash, ...safeUser } = user;
  return { user: safeUser, token: await createToken(user.id) };
}

export async function getSessionUser(token: string | undefined) {
  if (!token) {
    throw new AppError("Authentication is required.", 401);
  }

  const secret = getSecret();
  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [JWT_ALGORITHM],
    });
    if (!payload.sub) {
      throw new AppError("Invalid session.", 401);
    }
    userId = payload.sub;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Invalid or expired session.", 401);
  }

  const user = await authRepository.findSafeUserById(userId);
  if (!user) {
    throw new AppError("Invalid session.", 401);
  }
  return user;
}

export async function updateProfile(
  userId: string,
  input: ProfileInput,
) {
  const user = await authRepository.findUserForAuthById(userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (input.email !== undefined && input.email !== user.email) {
    const existingUser = await authRepository.findByEmail(input.email);
    if (existingUser) {
      throw new AppError("An account with this email already exists.", 409);
    }
  }

  const changesCredentials =
    input.email !== undefined || input.password !== undefined;
  if (
    changesCredentials &&
    (!input.currentPassword ||
      !(await bcrypt.compare(input.currentPassword, user.passwordHash)))
  ) {
    throw new AppError("Current password is incorrect.", 400);
  }

  const passwordHash = input.password
    ? await bcrypt.hash(input.password, 12)
    : undefined;

  return authRepository.updateUser(userId, {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(passwordHash !== undefined ? { passwordHash } : {}),
    ...(input.morningMotivation !== undefined
      ? { morningMotivation: input.morningMotivation }
      : {}),
  });
}

export function createRateLimitKey(
  scope: string,
  subject: string,
): string {
  return createHmac("sha256", getSecret())
    .update(`${scope}:${subject}`)
    .digest("hex");
}

export async function enforceRateLimit(
  scope: string,
  subject: string,
  limit: number,
  windowMilliseconds: number,
) {
  const key = createRateLimitKey(scope, subject);
  const allowed = await authRepository.consumeRateLimit(
    key,
    limit,
    windowMilliseconds,
  );
  if (!allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }
}

export function getClientAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
