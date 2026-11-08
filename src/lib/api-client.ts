"use client";

export type ApiEnvelope<T> = {
  success: true;
  data: T;
};

type ApiErrorPayload = {
  success: false;
  error?: {
    message?: string;
    details?: { path: string; message: string }[];
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError("Unable to reach the server. Check your connection.", 0);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError("The server returned an invalid response.", response.status);
  }

  if (!response.ok) {
    const error = payload as ApiErrorPayload;
    throw new ApiError(
      error.error?.message ?? "Something went wrong. Please try again.",
      response.status,
    );
  }

  const envelope = payload as ApiEnvelope<T>;
  if (envelope.success !== true || !("data" in envelope)) {
    throw new ApiError("The server returned an invalid response.", response.status);
  }
  return envelope.data;
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
