import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, AIGenerateOptions, AIGenerateResult } from "../types";

const client = new Anthropic({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/anthropic",
  timeout: 30 * 1000,
  maxRetries: 2,
});

// deepseek-v4-flash is the cost-efficient tier — good fit for a first test.
// deepseek-v4-pro is available too if quality on flash isn't sufficient.
const DEFAULT_MODEL = "deepseek-v4-flash";

export const deepseekProvider: AIProvider = {
  name: "deepseek",

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
        provider: "deepseek",
        model: DEFAULT_MODEL,
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
      };
    } catch (err) {
      if (err instanceof Anthropic.APIError) {
        console.error(
          `[DeepSeek Provider] API error (status ${err.status ?? "unknown"}):`,
          err.message
        );
      } else {
        console.error("[DeepSeek Provider] Unexpected error:", err);
      }
      throw new Error(
        "The AI provider is temporarily busy. Please try again in a moment."
      );
    }
  },
};