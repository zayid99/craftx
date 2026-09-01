import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, AIGenerateOptions, AIGenerateResult } from "../types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 30 * 1000, // hard cutoff — never let a request hang indefinitely
  maxRetries: 2, // auto-retries on 429/408/409/5xx with backoff, honors Retry-After header
});

const DEFAULT_MODEL = "claude-sonnet-4-6";

export class AIProviderError extends Error {
  constructor(message: string, public readonly retryable: boolean) {
    super(message);
    this.name = "AIProviderError";
  }
}

export const claudeProvider: AIProvider = {
  name: "claude",

  async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
    try {
      const response = await client.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: options.maxTokens ?? 1024,
        temperature: options.temperature,
        system: options.system,
        messages: options.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const textBlock = response.content.find((block) => block.type === "text");

      return {
        text: textBlock && textBlock.type === "text" ? textBlock.text : "",
        provider: "claude",
        model: DEFAULT_MODEL,
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
      };
    } catch (err) {
      if (err instanceof Anthropic.APIError) {
        console.error(
          `[Claude Provider] API error (status ${err.status ?? "unknown"}):`,
          err.message
        );
      } else {
        console.error("[Claude Provider] Unexpected error:", err);
      }

      // Normalized error — every route handler can catch this and show
      // the same safe message without needing to inspect provider internals.
      throw new AIProviderError(
        "The AI provider is temporarily busy. Please try again in a moment.",
        true
      );
    }
  },
};