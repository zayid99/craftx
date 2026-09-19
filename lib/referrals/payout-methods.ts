// Payout methods affiliates can choose. No server-only imports here, so the
// Affiliate page (a client component) can use this list too.
//
// To add a method later (e.g. PayPal), add an entry with its own id, label,
// field label and validation pattern. Existing payouts keep their stored id.

export interface PayoutMethod {
  id: string;
  label: string;
  detailsLabel: string;
  placeholder: string;
  pattern: RegExp;
  invalidMessage: string;
}

export const PAYOUT_METHODS: PayoutMethod[] = [
  {
    id: "usdt_trc20",
    label: "USDT — TRC20 (Tron)",
    detailsLabel: "TRC20 wallet address",
    placeholder: "T…",
    // Base58, starts with T, 34 characters.
    pattern: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
    invalidMessage: "That isn't a valid TRC20 address. It should start with T and be 34 characters long.",
  },
  {
    id: "usdt_bep20",
    label: "USDT — BEP20 (BNB Smart Chain)",
    detailsLabel: "BEP20 wallet address",
    placeholder: "0x…",
    // 0x followed by 40 hex characters.
    pattern: /^0x[a-fA-F0-9]{40}$/,
    invalidMessage: "That isn't a valid BEP20 address. It should start with 0x followed by 40 characters.",
  },
];

export function getPayoutMethod(id: string): PayoutMethod | undefined {
  return PAYOUT_METHODS.find((m) => m.id === id);
}

export function payoutMethodLabel(id: string): string {
  return getPayoutMethod(id)?.label ?? id;
}