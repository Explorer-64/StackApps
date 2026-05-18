import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { db } from "./admin";

const SUPER_ADMIN_EMAILS = ["stackapps.app@gmail.com"];

type AppDocument = {
  ownerId?: string;
  appUrl?: string;
  safetyVerified?: boolean;
  status?: string;
  moderationStatus?: string;
};

type ScanBooleans = {
  scan_reachable: boolean;
  scan_llms: boolean;
  scan_robots: boolean;
  scan_sitemap: boolean;
  scan_faq: boolean;
  scan_blueprint: boolean;
  scan_mcp: boolean;
  scan_cli: boolean;
  scan_pwa_android: boolean;
  scan_pwa_ios: boolean;
  scan_pwa_sw: boolean;
  scan_viewport: boolean;
  scan_safety_verified: boolean;
};

type ScanLabFields = {
  scan_lab_llms_full: boolean;
  scan_lab_openapi: boolean;
  scan_lab_webmcp: boolean;
  scan_lab_ap2_ucp_hint: boolean;
  scan_lab_verifiable_intent_hint: boolean;
};

type ScanFields = ScanBooleans &
  ScanLabFields & {
    scan_score: number;
  };

const EMPTY_LAB_FIELDS: ScanLabFields = {
  scan_lab_llms_full: false,
  scan_lab_openapi: false,
  scan_lab_webmcp: false,
  scan_lab_ap2_ucp_hint: false,
  scan_lab_verifiable_intent_hint: false,
};

const checkKeys = [
  "scan_reachable",
  "scan_llms",
  "scan_robots",
  "scan_sitemap",
  "scan_faq",
  "scan_blueprint",
  "scan_mcp",
  "scan_cli",
  "scan_pwa_android",
  "scan_pwa_ios",
  "scan_pwa_sw",
  "scan_viewport",
] as const;

function isStackAppsVerified(data: AppDocument): boolean {
  return data.safetyVerified === true || (data.moderationStatus === "approved" && data.status === "live");
}

function withPath(baseUrl: string, path: string): string {
  return new URL(path, baseUrl).toString();
}

/** Prefer https for installability checks; many listings still use http:// while the site redirects. */
function preferHttpsAppUrl(appUrl: string): string {
  try {
    const u = new URL(appUrl.trim());
    if (u.protocol === "http:") {
      u.protocol = "https:";
      return u.href;
    }
    return appUrl.trim();
  } catch {
    return appUrl.trim();
  }
}

const MANIFEST_FETCH_HEADERS: HeadersInit = {
  Accept: "application/manifest+json, application/json;q=0.9, */*;q=0.1",
  "User-Agent":
    "Mozilla/5.0 (compatible; StackAppsReadiness/1.0; +https://stackapps.app) Chrome/120.0.0.0 Safari/537.36",
};

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function statusIs200(url: string, method: "GET" | "HEAD"): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(url, { method, redirect: "follow" });
    return response.status === 200;
  } catch {
    return false;
  }
}

async function readHtml(appUrl: string): Promise<{ ok: boolean; html: string }> {
  try {
    const response = await fetchWithTimeout(appUrl, { method: "GET", redirect: "follow" });
    return {
      ok: response.status === 200,
      html: response.status === 200 ? await response.text() : "",
    };
  } catch {
    return { ok: false, html: "" };
  }
}

function hasAppleMobileMeta(html: string): boolean {
  return /<meta\b[^>]*\bname=["']apple-mobile-web-app-capable["'][^>]*>/i.test(html);
}

function hasViewportMeta(html: string): boolean {
  return /<meta\b[^>]*\bname=["']viewport["'][^>]*>/i.test(html);
}

function referencesServiceWorker(html: string): boolean {
  return /serviceWorker\.register|navigator\.serviceWorker|\/?sw\.js|service-worker\.js/i.test(html);
}

function extractManifestHrefFromHtml(html: string): string | null {
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/\brel\s*=\s*["']manifest["']/i.test(tag)) continue;
    const hrefMatch = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (hrefMatch?.[1]) return hrefMatch[1].trim();
  }
  return null;
}

function manifestPassesInstallableBar(manifest: {
  name?: unknown;
  short_name?: unknown;
  start_url?: unknown;
  display?: unknown;
  icons?: unknown;
}): boolean {
  const nameOk =
    (typeof manifest.name === "string" && manifest.name.trim().length > 0) ||
    (typeof manifest.short_name === "string" && manifest.short_name.trim().length > 0);
  if (!nameOk) return false;

  if (typeof manifest.start_url !== "string" || manifest.start_url.trim().length === 0) {
    return false;
  }

  const displayRaw = manifest.display;
  const displayNorm =
    typeof displayRaw === "string" ? displayRaw.trim().toLowerCase().replace(/_/g, "-") : "";
  if (displayNorm !== "standalone" && displayNorm !== "fullscreen" && displayNorm !== "minimal-ui") {
    return false;
  }

  if (!Array.isArray(manifest.icons)) {
    return false;
  }

  const iconHasSize = (icon: object, w: number, h: number): boolean => {
    const sizes = (icon as { sizes?: unknown }).sizes;
    if (typeof sizes === "string") {
      const s = sizes.toLowerCase();
      const needle = `${w}x${h}`;
      if (s.includes(needle)) return true;
    }
    const width = (icon as { width?: unknown }).width;
    const height = (icon as { height?: unknown }).height;
    if (typeof width === "number" && typeof height === "number") {
      return width === w && height === h;
    }
    return false;
  };

  const has192 = manifest.icons.some((icon) => {
    if (!icon || typeof icon !== "object") return false;
    return iconHasSize(icon, 192, 192);
  });

  const has512 = manifest.icons.some((icon) => {
    if (!icon || typeof icon !== "object") return false;
    return iconHasSize(icon, 512, 512);
  });

  return has192 && has512;
}

async function checkPwaInstallable(appUrl: string, html: string): Promise<boolean> {
  let baseForPwa: string;
  try {
    baseForPwa = preferHttpsAppUrl(appUrl);
    const parsed = new URL(baseForPwa);
    if (parsed.protocol !== "https:") {
      return false;
    }
  } catch {
    return false;
  }

  const candidates: string[] = [];
  const fromHtml = extractManifestHrefFromHtml(html);
  if (fromHtml) {
    try {
      candidates.push(new URL(fromHtml, baseForPwa).href);
    } catch {
      /* ignore bad href */
    }
  }
  for (const path of ["/manifest.webmanifest", "/site.webmanifest", "/manifest.json"]) {
    candidates.push(withPath(baseForPwa, path));
  }

  const seen = new Set<string>();
  for (const manifestUrl of candidates) {
    if (seen.has(manifestUrl)) continue;
    seen.add(manifestUrl);
    try {
      const response = await fetchWithTimeout(manifestUrl, {
        method: "GET",
        redirect: "follow",
        headers: MANIFEST_FETCH_HEADERS,
      });
      if (response.status !== 200) continue;
      const text = await response.text();
      const trimmed = text.replace(/^\uFEFF/, "").trim();
      if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) continue;
      const manifest = JSON.parse(trimmed) as Parameters<typeof manifestPassesInstallableBar>[0];
      if (manifestPassesInstallableBar(manifest)) return true;
    } catch {
      continue;
    }
  }
  return false;
}

async function fetchTextIf200(url: string): Promise<string> {
  try {
    const response = await fetchWithTimeout(url, { method: "GET", redirect: "follow" });
    if (response.status !== 200) {
      return "";
    }
    return await response.text();
  } catch {
    return "";
  }
}

async function isAdminUser(uid: string): Promise<boolean> {
  const snap = await db.collection("admin_users").doc(uid).get();
  return snap.exists;
}

async function computeLabSignals(
  appUrl: string,
  html: string,
  scan_llms: boolean,
  scan_blueprint: boolean,
): Promise<ScanLabFields> {
  const scan_lab_llms_full = await statusIs200(withPath(appUrl, "/llms-full.txt"), "HEAD");

  const openapiPaths = [
    "/openapi.json",
    "/swagger.json",
    "/api/openapi.json",
    "/v1/openapi.json",
    "/openapi.yaml",
    "/swagger/v1/swagger.json",
  ];
  let scan_lab_openapi = false;
  for (const p of openapiPaths) {
    if (await statusIs200(withPath(appUrl, p), "HEAD")) {
      scan_lab_openapi = true;
      break;
    }
  }

  const wellKnownMcp = await statusIs200(withPath(appUrl, "/.well-known/mcp"), "HEAD");
  const scan_lab_webmcp =
    wellKnownMcp ||
    /\bwebmcp\b/i.test(html) ||
    /rel\s*=\s*["'][^"']*mcp[^"']*["']/i.test(html);

  let combinedDocs = "";
  if (scan_llms) {
    combinedDocs += await fetchTextIf200(withPath(appUrl, "/llms.txt"));
  }
  if (scan_blueprint) {
    combinedDocs += await fetchTextIf200(withPath(appUrl, "/blueprint.txt"));
  }
  const haystack = `${combinedDocs}\n${html.slice(0, 12000)}`;
  const scan_lab_ap2_ucp_hint = /\b(AP2|UCP)\b|agent\s+payments?|universal\s+commerce/i.test(haystack);
  const scan_lab_verifiable_intent_hint =
    /verifiable\s+intent|FIDO[^.\n]{0,48}agent|agentic[^.\n]{0,48}credential/i.test(haystack);

  return {
    scan_lab_llms_full,
    scan_lab_openapi,
    scan_lab_webmcp,
    scan_lab_ap2_ucp_hint,
    scan_lab_verifiable_intent_hint,
  };
}

export async function scanApp(data: AppDocument): Promise<ScanFields> {
  const appUrl = data.appUrl;

  if (!appUrl) {
    const emptyChecks: ScanBooleans = {
      scan_reachable: false,
      scan_llms: false,
      scan_robots: false,
      scan_sitemap: false,
      scan_faq: false,
      scan_blueprint: false,
      scan_mcp: false,
      scan_cli: false,
      scan_pwa_android: false,
      scan_pwa_ios: false,
      scan_pwa_sw: false,
      scan_viewport: false,
      scan_safety_verified: isStackAppsVerified(data),
    };

    return { ...emptyChecks, ...EMPTY_LAB_FIELDS, scan_score: 0 };
  }

  const htmlPromise = readHtml(appUrl);
  const llmsPromise = statusIs200(withPath(appUrl, "/llms.txt"), "HEAD");
  const robotsPromise = statusIs200(withPath(appUrl, "/robots.txt"), "HEAD");
  const sitemapPromise = statusIs200(withPath(appUrl, "/sitemap.xml"), "HEAD");
  const faqPromise = statusIs200(withPath(appUrl, "/faq"), "HEAD");
  const blueprintPromise = statusIs200(withPath(appUrl, "/blueprint.txt"), "HEAD");
  const swHeadPromise = statusIs200(withPath(appUrl, "/sw.js"), "HEAD");

  const [htmlResult, scan_llms, scan_robots, scan_sitemap, scan_faq, scan_blueprint, swHead] = await Promise.all([
    htmlPromise,
    llmsPromise,
    robotsPromise,
    sitemapPromise,
    faqPromise,
    blueprintPromise,
    swHeadPromise,
  ]);

  const scan_pwa_android = await checkPwaInstallable(appUrl, htmlResult.html);

  const cliPattern = /npm install\s+-g\s+\S+|npx\s+\S+|uvx\s+\S+|pipx\s+\S+|brew install\s+\S+|pip install\s+\S+|cargo install\s+\S+/i;

  let scan_cli = cliPattern.test(htmlResult.html);

  if (!scan_cli && scan_llms) {
    const llmsBody = await fetchTextIf200(withPath(appUrl, "/llms.txt"));
    if (cliPattern.test(llmsBody)) {
      scan_cli = true;
    }
  }

  if (!scan_cli && scan_blueprint) {
    const blueprintBody = await fetchTextIf200(withPath(appUrl, "/blueprint.txt"));
    if (cliPattern.test(blueprintBody)) {
      scan_cli = true;
    }
  }

  let scan_mcp =
    /<link\b[^>]*\brel=["']mcp-server["'][^>]*>/i.test(htmlResult.html) ||
    /data-mcp-endpoint/i.test(htmlResult.html);

  const mcpInstallPattern = /claude mcp add\b|uvx\s+\S+-mcp\b|npx\s+\S+-mcp\b/i;

  if (!scan_mcp && scan_llms) {
    const llmsBody = await fetchTextIf200(withPath(appUrl, "/llms.txt"));
    if (mcpInstallPattern.test(llmsBody)) {
      scan_mcp = true;
    }
  }

  if (!scan_mcp && scan_blueprint) {
    const blueprintBody = await fetchTextIf200(withPath(appUrl, "/blueprint.txt"));
    if (mcpInstallPattern.test(blueprintBody)) {
      scan_mcp = true;
    }
  }

  const checks: ScanBooleans = {
    scan_reachable: htmlResult.ok,
    scan_llms,
    scan_robots,
    scan_sitemap,
    scan_faq,
    scan_blueprint,
    scan_mcp,
    scan_cli,
    scan_pwa_android,
    scan_pwa_ios: hasAppleMobileMeta(htmlResult.html),
    scan_pwa_sw: referencesServiceWorker(htmlResult.html) || swHead,
    scan_viewport: hasViewportMeta(htmlResult.html),
    scan_safety_verified: isStackAppsVerified(data),
  };

  const labFields = await computeLabSignals(appUrl, htmlResult.html, scan_llms, scan_blueprint);

  return {
    ...checks,
    ...labFields,
    scan_score: checkKeys.reduce((score, key) => score + (checks[key] ? 1 : 0), 0),
  };
}

async function scanAndUpdate(appId: string, data: AppDocument): Promise<ScanFields> {
  const scanFields = await scanApp(data);

  const passesBaseline =
    scanFields.scan_reachable &&
    scanFields.scan_robots &&
    scanFields.scan_sitemap &&
    scanFields.scan_llms;

  const ref = db.collection("apps").doc(appId);
  const snapshot = await ref.get();
  const appDoc = snapshot.data() as AppDocument | undefined;

  const update: Record<string, unknown> = {
    ...scanFields,
    scan_timestamp: FieldValue.serverTimestamp(),
  };

  if (!passesBaseline && appDoc?.status === "live") {
    update.status = "building";
  } else if (passesBaseline && appDoc?.status === "building" && appDoc?.safetyVerified === true) {
    update.status = "live";
  }

  await ref.update(update);

  return scanFields;
}

export const runReadinessScan = onDocumentWritten("apps/{appId}", async (event) => {
  const before = event.data?.before.data() as AppDocument | undefined;
  const afterSnapshot = event.data?.after;

  if (!afterSnapshot?.exists) {
    return;
  }

  const after = afterSnapshot.data() as AppDocument;

  if (
    after.moderationStatus !== "approved" ||
    after.status !== "live" ||
    before?.moderationStatus === "approved"
  ) {
    return;
  }

  await scanAndUpdate(event.params.appId, after);
});

export const manualRescan = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  const appId = request.data?.appId;

  if (typeof appId !== "string" || appId.trim() === "") {
    throw new HttpsError("invalid-argument", "appId is required.");
  }

  const ref = db.collection("apps").doc(appId);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new HttpsError("not-found", "App not found.");
  }

  const appDoc = snapshot.data() as AppDocument;

  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(request.auth.token.email ?? "");
  const isGrantedAdmin = !isSuperAdmin && (await isAdminUser(request.auth.uid));
  const adminStatus = isSuperAdmin || isGrantedAdmin;
  const ownerOrAdmin = adminStatus || request.auth.uid === appDoc.ownerId;

  if (!ownerOrAdmin) {
    throw new HttpsError("permission-denied", "Admin or owner access is required.");
  }

  if (!adminStatus) {
    const existingTimestamp = snapshot.get("scan_timestamp");
    if (
      typeof existingTimestamp?.toDate === "function" &&
      Date.now() - existingTimestamp.toDate().getTime() < 24 * 60 * 60 * 1000
    ) {
      throw new HttpsError("resource-exhausted", "Scan already run in the last 24 hours. Try again later.");
    }
  }

  await scanAndUpdate(appId, appDoc);

  const updated = await ref.get();
  const updatedData = updated.data() ?? {};
  const timestamp = updatedData.scan_timestamp;

  return {
    scan_reachable: updatedData.scan_reachable === true,
    scan_llms: updatedData.scan_llms === true,
    scan_robots: updatedData.scan_robots === true,
    scan_sitemap: updatedData.scan_sitemap === true,
    scan_faq: updatedData.scan_faq === true,
    scan_blueprint: updatedData.scan_blueprint === true,
    scan_mcp: updatedData.scan_mcp === true,
    scan_cli: updatedData.scan_cli === true,
    scan_pwa_android: updatedData.scan_pwa_android === true,
    scan_pwa_ios: updatedData.scan_pwa_ios === true,
    scan_pwa_sw: updatedData.scan_pwa_sw === true,
    scan_viewport: updatedData.scan_viewport === true,
    scan_safety_verified: updatedData.scan_safety_verified === true,
    scan_score: typeof updatedData.scan_score === "number" ? updatedData.scan_score : 0,
    scan_timestamp: typeof timestamp?.toDate === "function" ? timestamp.toDate().toISOString() : null,
    scan_lab_llms_full: updatedData.scan_lab_llms_full === true,
    scan_lab_openapi: updatedData.scan_lab_openapi === true,
    scan_lab_webmcp: updatedData.scan_lab_webmcp === true,
    scan_lab_ap2_ucp_hint: updatedData.scan_lab_ap2_ucp_hint === true,
    scan_lab_verifiable_intent_hint: updatedData.scan_lab_verifiable_intent_hint === true,
  };
});
