import { fetchWithTimeout, statusIs200, withPath } from "./scannerFetch";

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "Google-Extended",
  "PerplexityBot",
  "ClaudeBot",
  "CCBot",
  "anthropic-ai",
  "cohere-ai",
] as const;

const LLMS_MIN_BODY_CHARS = 50;
const SITEMAP_SAMPLE_SIZE = 10;
const SITEMAP_MIN_SUCCESS_RATE = 0.9;

type RobotsStanza = { agents: string[]; lines: string[] };

function isRootDisallow(line: string): boolean {
  const match = line.match(/^\s*Disallow\s*:\s*(.*?)\s*$/i);
  if (!match) return false;
  const path = match[1].trim();
  return path === "/" || path === "";
}

function parseRobotsStanzas(body: string): RobotsStanza[] {
  const stanzas: RobotsStanza[] = [];
  let current: RobotsStanza | null = null;

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;

    const uaMatch = line.match(/^User-agent\s*:\s*(.+)$/i);
    if (uaMatch) {
      if (current && current.lines.length > 0) {
        stanzas.push(current);
        current = { agents: [uaMatch[1].trim()], lines: [] };
      } else if (current) {
        current.agents.push(uaMatch[1].trim());
      } else {
        current = { agents: [uaMatch[1].trim()], lines: [] };
      }
      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }

  if (current) {
    stanzas.push(current);
  }

  return stanzas;
}

function stanzaBlocksWatchedAgents(stanza: RobotsStanza): boolean {
  const appliesToWatched = stanza.agents.some(
    (agent) => agent === "*" || (AI_CRAWLERS as readonly string[]).includes(agent),
  );
  if (!appliesToWatched) return false;
  return stanza.lines.some(isRootDisallow);
}

export function validateRobotsTxt(ok: boolean, body: string): boolean {
  if (!ok) return false;
  return !parseRobotsStanzas(body).some(stanzaBlocksWatchedAgents);
}

export function validateLlmsTxt(ok: boolean, body: string): boolean {
  if (!ok) return false;
  return body.trim().length >= LLMS_MIN_BODY_CHARS;
}

const FORMAT_A_CAPABILITY = /^## CAPABILITY:\s*\S/m;
const FORMAT_B_HEADER = /^## CAPABILITIES\s*$/m;
const FORMAT_B_INDEX_LINE = /^\S+:\s*\S+\s*\|\s*(mcp|ui|human-only)\s*$/m;

export function validateBlueprintTxt(ok: boolean, body: string): boolean {
  if (!ok) return false;
  if (!body.includes("# BLUEPRINT:")) return false;
  if (FORMAT_A_CAPABILITY.test(body)) return true;
  return FORMAT_B_HEADER.test(body) && FORMAT_B_INDEX_LINE.test(body);
}

function extractSitemapLocs(xml: string): string[] {
  const locs: string[] = [];
  const re = /<loc>(.*?)<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    const loc = match[1].trim();
    if (loc) locs.push(loc);
  }
  return locs;
}

function sampleEvenly(items: string[], max: number): string[] {
  if (items.length <= max) return items;
  const sampled: string[] = [];
  for (let i = 0; i < max; i++) {
    const index = Math.floor((i * (items.length - 1)) / (max - 1));
    sampled.push(items[index]);
  }
  return sampled;
}

export async function validateSitemap(appUrl: string): Promise<boolean> {
  const url = withPath(appUrl, "/sitemap.xml");
  let xml: string;

  try {
    const response = await fetchWithTimeout(url, { method: "GET", redirect: "follow" });
    if (response.status !== 200) return false;
    xml = await response.text();
  } catch {
    return false;
  }

  const locs = extractSitemapLocs(xml);
  if (locs.length === 0) return false;

  const sample = sampleEvenly(locs, SITEMAP_SAMPLE_SIZE);
  const results = await Promise.all(sample.map((loc) => statusIs200(loc, "HEAD")));
  const successCount = results.filter(Boolean).length;
  return successCount / sample.length >= SITEMAP_MIN_SUCCESS_RATE;
}
