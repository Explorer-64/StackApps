import { onRequest } from "firebase-functions/v2/https";
import type { DocumentData } from "firebase-admin/firestore";
import { db } from "./admin";
import { scanApp } from "./scanner";

function parseBodyUrl(req: { body?: unknown }): string | undefined {
  const raw = req.body;
  let parsed: unknown = raw;
  if (Buffer.isBuffer(raw)) {
    try {
      parsed = JSON.parse(raw.toString("utf8") || "{}");
    } catch {
      return undefined;
    }
  } else if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw || "{}");
    } catch {
      return undefined;
    }
  }
  if (parsed && typeof parsed === "object" && "url" in parsed) {
    const u = (parsed as { url?: unknown }).url;
    return typeof u === "string" ? u : undefined;
  }
  return undefined;
}

function serializeDoc(data: DocumentData): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  const ts = out.scan_timestamp;
  if (ts && typeof (ts as { toDate?: () => Date }).toDate === "function") {
    out.scan_timestamp = (ts as { toDate: () => Date }).toDate().toISOString();
  }
  const ca = out.converted_at;
  if (ca && typeof (ca as { toDate?: () => Date }).toDate === "function") {
    out.converted_at = (ca as { toDate: () => Date }).toDate().toISOString();
  }
  return out;
}

export const publicScan = onRequest({ cors: true }, async (req, res) => {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const url = parseBodyUrl(req);
  if (typeof url !== "string" || !url.startsWith("http")) {
    res.status(400).json({ error: "Valid URL required." });
    return;
  }

  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    res.status(400).json({ error: "Invalid URL." });
    return;
  }

  const ref = db.collection("free_scans").doc(hostname);
  const existing = await ref.get();

  if (existing.exists) {
    res.json({ already_scanned: true, ...serializeDoc(existing.data()!) });
    return;
  }

  const results = await scanApp({ appUrl: url });

  const doc = {
    domain: hostname,
    url,
    scan_score: results.scan_score,
    scan_results: results,
    scan_timestamp: new Date().toISOString(),
    converted: false,
    converted_at: null,
    app_id: null,
  };

  await ref.set(doc);
  res.json({ already_scanned: false, ...doc });
});
