import { onRequest } from "firebase-functions/v2/https";
import { db } from "./admin";

type SitemapRoute = {
  loc: string;
  priority: string;
};

const staticRoutes: SitemapRoute[] = [
  { loc: "https://stackapps.app/", priority: "1.0" },
  { loc: "https://stackapps.app/dashboard", priority: "0.9" },
  { loc: "https://stackapps.app/for-builders", priority: "0.9" },
  { loc: "https://stackapps.app/faq", priority: "0.8" },
  { loc: "https://stackapps.app/privacy", priority: "0.5" },
  { loc: "https://stackapps.app/terms", priority: "0.5" },
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderUrl(route: SitemapRoute, lastmod: string): string {
  return `  <url>
    <loc>${escapeXml(route.loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
}

export const sitemapXml = onRequest(async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const lastmod = new Date().toISOString().slice(0, 10);
  const snapshot = await db
    .collection("apps")
    .where("moderationStatus", "==", "approved")
    .where("status", "==", "live")
    .get();

  const appRoutes = snapshot.docs
    .map((doc) => doc.get("slug"))
    .filter((slug): slug is string => typeof slug === "string" && slug.trim() !== "")
    .map((slug) => ({
      loc: `https://stackapps.app/apps/${encodeURIComponent(slug)}`,
      priority: "0.8",
    }));

  const urls = [...staticRoutes, ...appRoutes].map((route) => renderUrl(route, lastmod)).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  res.set("Content-Type", "application/xml");
  res.set("Cache-Control", "public, max-age=300, s-maxage=300");
  res.status(200).send(xml);
});
