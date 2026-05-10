import { onRequest } from "firebase-functions/v2/https";
import { db } from "./admin";

type BadgeApp = {
  slug?: string;
  status?: string;
  moderationStatus?: string;
  scan_score?: number;
};

function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getAppId(path: string): string | null {
  const match = path.match(/^\/badge\/([^/?#]+)\.svg$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function renderBadge(app: BadgeApp | null): string {
  const isLiveApproved = app?.moderationStatus === "approved" && app.status === "live";
  const isVerified = isLiveApproved;
  const statusText = isVerified ? "StackApps Verified ✓" : "Pending Verification";
  const statusColor = isVerified ? "#22c55e" : "#6b7280";
  const rawScore = typeof app?.scan_score === "number" ? app.scan_score : 0;
  const score = Math.max(0, Math.min(12, Math.round(rawScore)));
  const slug = isLiveApproved && app?.slug ? app.slug : "";
  const href = slug ? `https://stackapps.app/apps/${encodeURIComponent(slug)}` : "https://stackapps.app";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="72" viewBox="0 0 360 72" role="img" aria-label="StackApps ${escapeXml(statusText)} ${score}/12 checks">
  <a href="${escapeXml(href)}" target="_top">
    <rect width="360" height="72" rx="14" fill="#111827"/>
    <rect x="8" y="8" width="126" height="32" rx="8" fill="#1a1a2e"/>
    <rect x="134" y="8" width="218" height="32" rx="8" fill="${statusColor}"/>
    <text x="71" y="29" text-anchor="middle" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="15" font-weight="700" fill="#ffffff">StackApps</text>
    <text x="243" y="29" text-anchor="middle" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="15" font-weight="700" fill="#ffffff">${escapeXml(statusText)}</text>
    <text x="180" y="58" text-anchor="middle" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="13" font-weight="600" fill="#d1d5db">${score}/12 checks</text>
  </a>
</svg>`;
}

export const appBadge = onRequest(async (req, res) => {
  res.set("Content-Type", "image/svg+xml");
  res.set("Cache-Control", "public, max-age=3600");

  const appId = getAppId(req.path) ?? getAppId(new URL(req.url, "https://stackapps.app").pathname);

  if (!appId) {
    res.status(200).send(renderBadge(null));
    return;
  }

  const snapshot = await db.collection("apps").doc(appId).get();

  if (!snapshot.exists) {
    res.status(200).send(renderBadge(null));
    return;
  }

  res.status(200).send(renderBadge(snapshot.data() as BadgeApp));
});
