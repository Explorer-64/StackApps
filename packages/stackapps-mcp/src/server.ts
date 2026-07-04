#!/usr/bin/env node
// @ts-nocheck — MCP SDK registerTool + Zod triggers TS2589 under this repo’s TypeScript; tool args are validated at runtime.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const DEFAULT_PUBLIC_SCAN_URL =
  process.env.STACKAPPS_PUBLIC_SCAN_URL ??
  "https://us-central1-stackapps-dcab1.cloudfunctions.net/publicScan";

async function postPublicScan(url: string): Promise<unknown> {
  const res = await fetch(DEFAULT_PUBLIC_SCAN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`Scan failed (${res.status})`);
    (err as Error & { body?: unknown }).body = body;
    throw err;
  }
  return body;
}

const server = new McpServer(
  { name: "stackapps-readiness", version: "0.1.0" },
  {
    instructions:
      "StackApps exposes the same public HTTPS readiness scan as stackapps.app/scan. Use tool readiness_scan with a full https URL. Server-side rules apply (e.g. one stored free scan per hostname).",
  },
);

server.registerTool(
  "readiness_scan",
  {
    description:
      "Run StackApps twelve-signal readiness scan on a live site. Returns JSON including scan_score, scan_results booleans, already_scanned, and timestamps when present.",
    inputSchema: {
      url: z
        .string()
        .url()
        .describe("Full HTTPS URL of the app to scan, e.g. https://example.com"),
    },
  },
  async ({ url }) => {
    if (!url.startsWith("http")) {
      return {
        isError: true as const,
        content: [{ type: "text" as const, text: JSON.stringify({ error: "url must use http or https" }) }],
      };
    }
    try {
      const data = await postPublicScan(url);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const body = e && typeof e === "object" && "body" in e ? (e as { body?: unknown }).body : undefined;
      return {
        isError: true as const,
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: msg, details: body }, null, 2),
          },
        ],
      };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
