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

type ScanFields = ScanBooleans & {
  scan_score: number;
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

async function checkPwaInstallable(appUrl: string): Promise<boolean> {
  try {
    const parsed = new URL(appUrl);
    if (parsed.protocol !== "https:") {
      return false;
    }
  } catch {
    return false;
  }

  const manifestUrl = withPath(appUrl, "/manifest.json");

  try {
    const response = await fetchWithTimeout(manifestUrl, { method: "GET", redirect: "follow" });
    if (response.status !== 200) {
      return false;
    }

    const manifest = (await response.json()) as {
      name?: unknown;
      short_name?: unknown;
      start_url?: unknown;
      display?: unknown;
      icons?: unknown;
    };

    const nameOk =
      (typeof manifest.name === "string" && manifest.name.trim().length > 0) ||
      (typeof manifest.short_name === "string" && manifest.short_name.trim().length > 0);
    if (!nameOk) {
      return false;
    }

    if (typeof manifest.start_url !== "string" || manifest.start_url.trim().length === 0) {
      return false;
    }

    if (manifest.display !== "standalone" && manifest.display !== "fullscreen" && manifest.display !== "minimal-ui") {
      return false;
    }

    if (!Array.isArray(manifest.icons)) {
      return false;
    }

    const has192 = manifest.icons.some((icon) => {
      if (!icon || typeof icon !== "object") return false;
      const sizes = (icon as { sizes?: unknown }).sizes;
      return typeof sizes === "string" && sizes.includes("192x192");
    });

    const has512 = manifest.icons.some((icon) => {
      if (!icon || typeof icon !== "object") return false;
      const sizes = (icon as { sizes?: unknown }).sizes;
      return typeof sizes === "string" && sizes.includes("512x512");
    });

    return has192 && has512;
  } catch {
    return false;
  }
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

    return { ...emptyChecks, scan_score: 0 };
  }

  const htmlPromise = readHtml(appUrl);
  const llmsPromise = statusIs200(withPath(appUrl, "/llms.txt"), "HEAD");
  const robotsPromise = statusIs200(withPath(appUrl, "/robots.txt"), "HEAD");
  const sitemapPromise = statusIs200(withPath(appUrl, "/sitemap.xml"), "HEAD");
  const faqPromise = statusIs200(withPath(appUrl, "/faq"), "HEAD");
  const blueprintPromise = statusIs200(withPath(appUrl, "/blueprint.txt"), "HEAD");
  const pwaAndroidPromise = checkPwaInstallable(appUrl);
  const swHeadPromise = statusIs200(withPath(appUrl, "/sw.js"), "HEAD");

  const [
    htmlResult,
    scan_llms,
    scan_robots,
    scan_sitemap,
    scan_faq,
    scan_blueprint,
    scan_pwa_android,
    swHead,
  ] =
    await Promise.all([
      htmlPromise,
      llmsPromise,
      robotsPromise,
      sitemapPromise,
      faqPromise,
      blueprintPromise,
      pwaAndroidPromise,
      swHeadPromise,
    ]);

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

  return {
    ...checks,
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
  };
});
