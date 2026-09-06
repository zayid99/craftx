/**
 * Cost per 1,000,000 tokens, in USD.
 *
 * These numbers feed the spend cap, so they deliberately err HIGH.
 *
 * DeepSeek moved to peak/off-peak billing on 2026-08-16, where peak is
 * roughly 2x off-peak. Rather than track UTC windows (and get them wrong),
 * we always bill at the peak rate. Over-estimating trips the cap early,
 * which is safe. Under-estimating is what drains a balance unnoticed.
 * Actual DeepSeek spend will be equal to or lower than what this reports.
 *
 * Source of truth for real spend is DeepSeek's GET /user/balance endpoint.
 * Reconcile against it monthly.
 *
 * Rates last verified: 2026-09-06.
 */
interface ModelRate {
  input: number;
  output: number;
}

const PRICING: Record<string, ModelRate> = {
  // DeepSeek — peak-hour rates
  "deepseek-v4-flash": { input: 0.44, output: 1.32 },
  "deepseek-v4-pro": { input: 0.66, output: 1.98 },

  // Anthropic
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-sonnet-5": { input: 2.0, output: 10.0 },
  "claude-haiku-4-5": { input: 1.0, output: 5.0 },
};

/**
 * Used when a model isn't in the table above. Intentionally expensive:
 * an unknown model should make the bill look worse than it is, never
 * better. The old behaviour returned 0, which is how five of six studios
 * came to report no cost at all.
 */
const FALLBACK_RATE: ModelRate = { input: 3.0, output: 15.0 };

export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const known = PRICING[model];

  if (!known) {
    console.error(
      `[Pricing] No rate entry for model "${model}". Billing at the fallback ` +
        `rate ($${FALLBACK_RATE.input}/$${FALLBACK_RATE.output} per 1M) so this ` +
        `usage is not recorded as $0. Add it to PRICING in lib/usage/pricing.ts.`
    );
  }

  const rate = known ?? FALLBACK_RATE;
  const cost =
    (inputTokens / 1_000_000) * rate.input +
    (outputTokens / 1_000_000) * rate.output;

  return Math.round(cost * 1_000_000) / 1_000_000;
}

/** Exposed so the spend cap and admin dashboard can show which models are priced. */
export function getKnownModels(): string[] {
  return Object.keys(PRICING);
}