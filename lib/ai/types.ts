export type AIProviderName = "claude" | "deepseek" | "gemini" | "openai" | "kimi";

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIGenerateOptions {
  system?: string;
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface AIGenerateResult {
  text: string;
  provider: AIProviderName;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface AIProvider {
  name: AIProviderName;
  generate(options: AIGenerateOptions): Promise<AIGenerateResult>;
}