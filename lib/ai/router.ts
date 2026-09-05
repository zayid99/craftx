import type { AIProviderName, AIGenerateOptions, AIGenerateResult } from "./types";
import { claudeProvider } from "./providers/claude";
import { deepseekProvider } from "./providers/deepseek";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const providers: Record<AIProviderName, AIGenerateOptions extends never ? never : any> = {
  claude: claudeProvider,
  deepseek: deepseekProvider,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

export async function generateWithProvider(
  providerName: AIProviderName,
  options: AIGenerateOptions
): Promise<AIGenerateResult> {
  const provider = providers[providerName];

  if (!provider) {
    throw new Error(`AI provider "${providerName}" is not configured yet.`);
  }

  return provider.generate(options);
}