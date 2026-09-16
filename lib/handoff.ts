/**
 * Script Studio -> Script Analyzer handoff.
 *
 * A full script is too long for a URL, so it travels in sessionStorage:
 * scoped to this browser tab, never sent to the server, and removed as soon
 * as the Analyzer reads it. The Analyzer only looks for it when opened with
 * ?from=script, so a stale entry can't pre-fill a normal visit.
 *
 * Client-only: call these from event handlers or effects, never during render.
 */

const ANALYZER_HANDOFF_KEY = "craftx:analyzer-handoff";

export type AnalyzerHandoff = {
  title: string;
  transcript: string;
  platform: string;
};

export function writeAnalyzerHandoff(data: AnalyzerHandoff): void {
  try {
    sessionStorage.setItem(ANALYZER_HANDOFF_KEY, JSON.stringify(data));
  } catch {
    /* storage blocked (private mode etc.) — the Analyzer just opens empty */
  }
}

/** Reads and clears the handoff. Returns null if missing or malformed. */
export function takeAnalyzerHandoff(): AnalyzerHandoff | null {
  try {
    const raw = sessionStorage.getItem(ANALYZER_HANDOFF_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(ANALYZER_HANDOFF_KEY);

    const parsed = JSON.parse(raw) as Partial<AnalyzerHandoff>;
    if (typeof parsed.transcript !== "string" || !parsed.transcript.trim()) return null;

    return {
      title: typeof parsed.title === "string" ? parsed.title : "",
      transcript: parsed.transcript,
      platform: typeof parsed.platform === "string" ? parsed.platform : "",
    };
  } catch {
    return null;
  }
}