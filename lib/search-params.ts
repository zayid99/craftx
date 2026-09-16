/**
 * Helpers for passing work between studios through the URL
 * (e.g. /scripts?topic=...&platform=...). No server-only imports, so client
 * components can use studioHref too.
 */

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** First value of a query param, trimmed and length-capped; "" if missing. */
export function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
  max: number
): string {
  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Builds a studio link like /seo?topic=...&platform=..., skipping empty values. */
export function studioHref(
  path: string,
  params: Record<string, string | null | undefined>
): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const query = qs.toString();
  return query ? `${path}?${query}` : path;
}