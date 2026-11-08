import "server-only";
import {
  AIInsightType,
  Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const aiInsightRepository = {
  create(
    userId: string,
    type: AIInsightType,
    content: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return prisma.aIInsight.create({
      data: {
        userId,
        type,
        content,
        ...(metadata !== undefined ? { metadata } : {}),
      },
      select: {
        id: true,
        type: true,
        content: true,
        metadata: true,
        generatedAt: true,
      },
    });
  },
};
