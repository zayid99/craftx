import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/getUser";

export const runtime = "nodejs";

/** Keeps prompts (and cost) bounded on very long videos. */
const MAX_TRANSCRIPT_CHARS = 20000;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

type CaptionTrack = {
  baseUrl: string;
  languageCode?: string;
  kind?: string; // "asr" for auto-generated
  name?: { simpleText?: string };
};

/** Pulls the 11-character video id out of the common YouTube URL shapes. */
function extractYouTubeId(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return /^[\w-]{11}$/.test(id) ? id : null;
  }

  if (host === "youtube.com" || host === "music.youtube.com") {
    const v = url.searchParams.get("v");
    if (v && /^[\w-]{11}$/.test(v)) return v;

    // /shorts/<id>, /embed/<id>, /live/<id>
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && ["shorts", "embed", "live", "v"].includes(parts[0])) {
      return /^[\w-]{11}$/.test(parts[1]) ? parts[1] : null;
    }
  }

  return null;
}

function detectHost(raw: string): string {
  try {
    return new URL(raw.trim()).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Decodes the small set of XML entities that appear in caption text. */
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;#39;/g, "'")
    .replace(/&amp;quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let url: unknown;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!url || typeof url !== "string" || !url.trim()) {
    return NextResponse.json({ error: "Please paste a video URL." }, { status: 400 });
  }

  const videoId = extractYouTubeId(url);

  if (!videoId) {
    const host = detectHost(url);
    const known = ["tiktok.com", "instagram.com", "facebook.com", "x.com", "twitter.com", "vm.tiktok.com"];

    if (known.some((k) => host.endsWith(k))) {
      return NextResponse.json(
        {
          error: `${host} doesn't expose captions publicly, so CraftX can't pull a transcript from it yet. Paste the transcript instead — most editing apps and TikTok's own caption tool can export one.`,
          unsupportedHost: true,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          "That doesn't look like a YouTube link. Transcript import currently supports YouTube only — paste the transcript for anything else.",
        unsupportedHost: true,
      },
      { status: 400 }
    );
  }

  try {
    const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
      headers: { "User-Agent": BROWSER_UA, "Accept-Language": "en-US,en;q=0.9" },
      cache: "no-store",
    });

    if (!watchRes.ok) {
      return NextResponse.json(
        { error: "Could not reach that video. Check the link is public and try again." },
        { status: 502 }
      );
    }

    const html = await watchRes.text();

    // Title, for pre-filling the analysis
    const titleMatch =
      html.match(/<meta\s+name="title"\s+content="([^"]*)"/) ??
      html.match(/<title>([^<]*)<\/title>/);
    const title = titleMatch ? decodeEntities(titleMatch[1]).replace(/\s*-\s*YouTube$/, "") : "";

    // Caption tracks are embedded in the watch page's player config
    const tracksMatch = html.match(/"captionTracks":(\[.*?\])/);
    if (!tracksMatch) {
      return NextResponse.json(
        {
          error:
            "This video has no captions available, so there's no transcript to import. Paste the transcript manually to analyze it.",
          noCaptions: true,
          title,
        },
        { status: 422 }
      );
    }

    let tracks: CaptionTrack[];
    try {
      tracks = JSON.parse(tracksMatch[1]);
    } catch {
      return NextResponse.json(
        { error: "Could not read this video's captions. Paste the transcript instead." },
        { status: 422 }
      );
    }

    if (!tracks.length) {
      return NextResponse.json(
        {
          error:
            "This video has no captions available. Paste the transcript manually to analyze it.",
          noCaptions: true,
          title,
        },
        { status: 422 }
      );
    }

    // Prefer a human-written English track, then any English, then whatever exists
    const track =
      tracks.find((t) => t.languageCode?.startsWith("en") && t.kind !== "asr") ??
      tracks.find((t) => t.languageCode?.startsWith("en")) ??
      tracks[0];

    // YouTube frequently returns an EMPTY body for fmt=json3 depending on the
    // caller's IP/headers, so read as text first and fall back to the XML feed.
    // Never call .json() directly — an empty body throws a SyntaxError.
    async function fetchCaptions(url: string): Promise<string> {
      const r = await fetch(url, {
        headers: {
          "User-Agent": BROWSER_UA,
          "Accept-Language": "en-US,en;q=0.9",
          Referer: `https://www.youtube.com/watch?v=${videoId}`,
        },
        cache: "no-store",
      });
      if (!r.ok) return "";
      return (await r.text()).trim();
    }

    /** json3 shape: { events: [{ segs: [{ utf8 }] }] } */
    function parseJson3(raw: string): string {
      try {
        const parsed = JSON.parse(raw) as { events?: { segs?: { utf8?: string }[] }[] };
        return (parsed.events ?? [])
          .flatMap((e) => e.segs ?? [])
          .map((seg) => seg.utf8 ?? "")
          .join("");
      } catch {
        return "";
      }
    }

    /** Legacy XML shape: <text start="..">escaped content</text> */
    function parseXml(raw: string): string {
      const matches = [...raw.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)];
      return matches.map((m) => decodeEntities(m[1])).join(" ");
    }

    const base = track.baseUrl.replace(/\\u0026/g, "&");

    let transcript = "";

    const json3Raw = await fetchCaptions(`${base}&fmt=json3`);
    if (json3Raw) transcript = parseJson3(json3Raw);

    if (!transcript) {
      const xmlRaw = await fetchCaptions(base);
      if (xmlRaw) transcript = parseXml(xmlRaw);
    }

    transcript = transcript.replace(/\n+/g, " ").replace(/\s{2,}/g, " ").trim();

    if (!transcript) {
      return NextResponse.json(
        {
          error:
            "YouTube returned no caption data for this video. This can happen when captions are disabled, region-locked, or YouTube blocks the request. Paste the transcript manually to analyze it.",
          noCaptions: true,
          title,
        },
        { status: 422 }
      );
    }

    if (transcript.length < 50) {
      return NextResponse.json(
        {
          error:
            "The captions on this video were too short to analyze. Paste a fuller transcript instead.",
          noCaptions: true,
          title,
        },
        { status: 422 }
      );
    }

    const truncated = transcript.length > MAX_TRANSCRIPT_CHARS;

    return NextResponse.json({
      transcript: truncated ? transcript.slice(0, MAX_TRANSCRIPT_CHARS) : transcript,
      title,
      autoGenerated: track.kind === "asr",
      truncated,
    });
  } catch (error) {
    // Log the message explicitly — bare error objects here were hard to diagnose.
    console.error(
      "[analyzer/transcript] failed for video",
      videoId,
      error instanceof Error ? `${error.name}: ${error.message}` : error
    );
    return NextResponse.json(
      {
        error:
          "Could not import that transcript. Paste it manually instead, or try a different video.",
      },
      { status: 500 }
    );
  }
}