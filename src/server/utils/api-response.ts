import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { ZodError } from "zod";
import { AppError } from "@/server/utils/app-error";

export async function readJson(
  request: Request,
  required = true,
): Promise<unknown> {
  const maximumBytes = 8_192;
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maximumBytes) {
    throw new AppError("Request body is too large.", 413);
  }

  const reader = request.body?.getReader();
  if (!reader) {
    if (!required) {
      return {};
    }
    throw new AppError("Request body is required.", 400);
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maximumBytes) {
        await reader.cancel();
        throw new AppError("Request body is too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const body = new TextDecoder().decode(bytes);
  if (!required && body.length === 0) {
    return {};
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new AppError("Request body must be valid JSON.", 400);
  }
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Request validation failed.",
          details: error.issues.map(({ path, message }) => ({
            path: path.join("."),
            message,
          })),
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: { message: "An account with this email already exists." } },
        { status: 409 },
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: { message: "The requested record was not found." } },
        { status: 404 },
      );
    }
  }

  console.error("Unhandled API error:", error);
  return NextResponse.json(
    { success: false, error: { message: "An unexpected error occurred." } },
    { status: 500 },
  );
}
