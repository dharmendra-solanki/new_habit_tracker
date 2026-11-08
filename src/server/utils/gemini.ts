import "server-only";
import { GoogleGenAI } from "@google/genai";
import { AppError } from "@/server/utils/app-error";

let client: GoogleGenAI | undefined;
let configuredApiKey: string | undefined;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new AppError(
      "AI features are not configured. Set GEMINI_API_KEY on the server.",
      503,
    );
  }

  if (!client || configuredApiKey !== apiKey) {
    client = new GoogleGenAI({
      apiKey,
      apiVersion: "v1beta",
      httpOptions: {
        timeout: 30_000,
        retryOptions: { attempts: 1 },
      },
    });
    configuredApiKey = apiKey;
  }

  return client;
}

export async function generateAIText({
  systemInstruction,
  prompt,
  temperature = 0.7,
  json = false,
}: {
  systemInstruction: string;
  prompt: string;
  temperature?: number;
  json?: boolean;
}) {
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  if (model.length > 100) {
    throw new Error("GEMINI_MODEL must be no longer than 100 characters.");
  }

  try {
    const response = await getClient().models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature,
        maxOutputTokens: 1024,
        ...(json ? { responseMimeType: "application/json" } : {}),
      },
    });
    const content = response.text?.trim();
    if (!content) {
      throw new AppError(
        "The AI provider returned an empty response. Please try again.",
        502,
      );
    }
    return content;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : undefined;
    if (status === 429) {
      throw new AppError(
        "The AI provider is rate-limited. Please try again in a few minutes.",
        503,
      );
    }
    console.error(
      "Gemini request failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    throw new AppError("The AI service is temporarily unavailable.", 502);
  }
}
