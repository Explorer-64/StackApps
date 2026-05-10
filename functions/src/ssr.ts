import { onRequest } from "firebase-functions/v2/https";
import { db } from "./admin";

type AppListing = {
  name?: string;
  description?: string;
  slug?: string;
  url?: string;
  appUrl?: string;
  image?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  category?: string;
  scan_public?: boolean;
  scan_score?: number;
  scan_reachable?: boolean;
  scan_llms?: boolean;
  scan_robots?: boolean;
  scan_sitemap?: boolean;
  scan_faq?: boolean;
  scan_blueprint?: boolean;
  scan_mcp?: boolean;
  scan_cli?: boolean;
  scan_pwa_android?: boolean;
  scan_pwa_ios?: boolean;
  scan_pwa_sw?: boolean;
  scan_viewport?: boolean;
  scan_timestamp?: unknown;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeJsonForHtml(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function getSlug(path: string): string | null {
  const match = path.match(/^\/apps\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function renderNotFound(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>App not found — StackApps</title>
  <meta name="robots" content="noindex">
</head>
<body>
  <main>
    <h1>App not found</h1>
    <p>This StackApps listing is not available.</p>
  </main>
</body>
</html>`;
}

function renderListing(app: AppListing, slug: string): string {
  const name = app.name ?? "StackApps listing";
  const description = app.description ?? "";
  const listingUrl = `https://stackapps.app/apps/${encodeURIComponent(slug)}`;
  const appUrl = app.url ?? app.appUrl ?? listingUrl;
  const image = app.image ?? app.imageUrl ?? app.thumbnailUrl ?? "https://stackapps.app/og-image.png";
  const category = app.category ?? "SoftwareApplication";
  const showScan = app.scan_public === true;
  const verified =
    app.scan_reachable === true &&
    app.scan_robots === true &&
    app.scan_sitemap === true &&
    app.scan_llms === true &&
    app.scan_faq === true &&
    app.scan_viewport === true &&
    app.scan_mcp === true &&
    app.scan_cli === true;
  const pwaAndroid = app.scan_pwa_android === true;
  const pwaGreen = pwaAndroid && app.scan_pwa_ios === true && app.scan_pwa_sw === true;
  const pwaAmber = pwaAndroid && !pwaGreen;
  const blueprint = app.scan_blueprint === true;
  const checks: Array<[label: string, value: boolean]> = [
    ["Site reachable", app.scan_reachable === true],
    ["llms.txt", app.scan_llms === true],
    ["robots.txt", app.scan_robots === true],
    ["sitemap.xml", app.scan_sitemap === true],
    ["FAQ presence", app.scan_faq === true],
    ["Blueprint Protocol", app.scan_blueprint === true],
    ["MCP endpoint", app.scan_mcp === true],
    ["CLI available", app.scan_cli === true],
    ["Android PWA", app.scan_pwa_android === true],
    ["iOS PWA", app.scan_pwa_ios === true],
    ["Service Worker", app.scan_pwa_sw === true],
    ["Viewport meta", app.scan_viewport === true],
  ];
  const scanTimestamp =
    typeof (app.scan_timestamp as { toDate?: unknown } | undefined)?.toDate === "function"
      ? (app.scan_timestamp as { toDate: () => Date }).toDate().toISOString()
      : typeof app.scan_timestamp === "string"
        ? app.scan_timestamp
        : "";
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url: appUrl,
    applicationCategory: category,
    offers: {
      "@type": "Offer",
      price: "0",
    },
    publisher: {
      "@type": "Organization",
      name: "StackApps",
    },
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(name)} — Listed on StackApps</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:title" content="${escapeHtml(`${name} — Listed on StackApps`)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(listingUrl)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <script type="application/ld+json">${escapeJsonForHtml(schema)}</script>
</head>
<body>
  <main>
    <h1>${escapeHtml(name)}</h1>
    <p>${escapeHtml(description)}</p>
    <a href="${escapeHtml(appUrl)}">${escapeHtml(name)}</a>
    ${
      verified || pwaAndroid || blueprint
        ? `<section>
    <h2>StackApps Badges</h2>
    ${verified ? "<p>StackApps Verified</p>" : ""}
    ${pwaGreen ? "<p>PWA Ready</p>" : pwaAmber ? "<p>PWA Partial</p>" : ""}
    ${blueprint ? "<p>Blueprint</p>" : ""}
  </section>`
        : ""
    }
    ${
      showScan
        ? `<section>
    <h2>Site Readiness</h2>
    ${scanTimestamp ? `<p>Last checked: ${escapeHtml(scanTimestamp)}</p>` : ""}
    <ul>
      ${checks
        .map(([label, passed]) => `<li>${escapeHtml(label)}: ${passed ? "PASS" : "FAIL"}</li>`)
        .join("")}
    </ul>
  </section>`
        : ""
    }
  </main>
</body>
</html>`;
}

export const ssrAppListing = onRequest(async (req, res) => {
  const slug = getSlug(req.path) ?? getSlug(new URL(req.url, "https://stackapps.app").pathname);

  if (!slug) {
    res.status(404).send(renderNotFound());
    return;
  }

  const snapshot = await db
    .collection("apps")
    .where("slug", "==", slug)
    .where("moderationStatus", "==", "approved")
    .where("status", "==", "live")
    .limit(1)
    .get();

  if (snapshot.empty) {
    res.status(404).send(renderNotFound());
    return;
  }

  const app = snapshot.docs[0].data() as AppListing;
  res.set("Cache-Control", "public, max-age=300, s-maxage=600");
  res.status(200).send(renderListing(app, slug));
});
