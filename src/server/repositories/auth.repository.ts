import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  morningMotivation: true,
  createdAt: true,
} as const;

export const authRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        ...safeUserSelect,
        passwordHash: true,
      },
    });
  },

  findSafeUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });
  },

  findUserForAuthById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        ...safeUserSelect,
        passwordHash: true,
      },
    });
  },

  createUser(input: { name: string; email: string; passwordHash: string }) {
    return prisma.user.create({
      data: {
        ...input,
        avatar: input.name.charAt(0).toUpperCase(),
      },
      select: safeUserSelect,
    });
  },

  updateUser(
    id: string,
    data: {
      name?: string;
      email?: string;
      passwordHash?: string;
      morningMotivation?: boolean;
    },
  ) {
    return prisma.user.update({
      where: { id },
      data: {
        ...data,
        ...(data.name !== undefined
          ? { avatar: data.name.charAt(0).toUpperCase() }
          : {}),
      },
      select: safeUserSelect,
    });
  },

  async consumeRateLimit(
    key: string,
    limit: number,
    windowMilliseconds: number,
  ): Promise<boolean> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMilliseconds);
    const cleanupBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const [result] = await prisma.$queryRaw<{ attempts: number }[]>(
      Prisma.sql`
        WITH expired AS (
          DELETE FROM "AuthRateLimit"
          WHERE "windowStartedAt" < ${cleanupBefore}
            AND "key" <> ${key}
          RETURNING "key"
        )
        INSERT INTO "AuthRateLimit" ("key", "attempts", "windowStartedAt", "updatedAt")
        VALUES (${key}, 1, ${now}, ${now})
        ON CONFLICT ("key") DO UPDATE
        SET
          "attempts" = CASE
            WHEN "AuthRateLimit"."windowStartedAt" <= ${windowStart} THEN 1
            ELSE "AuthRateLimit"."attempts" + 1
          END,
          "windowStartedAt" = CASE
            WHEN "AuthRateLimit"."windowStartedAt" <= ${windowStart} THEN ${now}
            ELSE "AuthRateLimit"."windowStartedAt"
          END,
          "updatedAt" = ${now}
        RETURNING "attempts"
      `,
    );

    return result.attempts <= limit;
  },
};
