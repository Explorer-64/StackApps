import type { Plugin } from "vite";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  NOSCRIPT_ROUTES,
  buildFaqJsonLd,
  routeToFilePath,
  type NoscriptRoute,
} from "./noscript-routes";

const SITE = "https://stackapps.app";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setMeta(html: string, attr: "name" | "property", key: string, value: string): string {
  const pattern = new RegExp(
    `<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*/?>`,
    "i",
  );
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function setTitle(html: string, title: string): string {
  return html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
}

function setCanonical(html: string, href: string): string {
  const pattern = /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i;
  const tag = `<link rel="canonical" href="${escapeHtml(href)}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function injectNoscript(html: string, bodyHtml: string): string {
  const block = `\n    <noscript id="static-fallback">\n${bodyHtml.trim()}\n    </noscript>\n`;
  if (html.includes('id="static-fallback"')) {
    return html.replace(/<noscript id="static-fallback">[\s\S]*?<\/noscript>/, block.trim());
  }
  return html.replace('<div id="root"></div>', `${block}    <div id="root"></div>`);
}

function stripGraphFaqPage(html: string): string {
  return html.replace(/,\s*\{\s*"@type": "FAQPage"[\s\S]*?\n\s*\}/, "");
}

function injectFaqJsonLd(html: string, route: NoscriptRoute): string {
  if (!route.faqJsonLd?.length) return html;
  if (route.path === "/") return html;
  const faqScript = `\n    <script type="application/ld+json">\n${buildFaqJsonLd(route.faqJsonLd)}\n    </script>`;
  return html.replace("</head>", `${faqScript}\n  </head>`);
}

function applyRouteMeta(html: string, route: NoscriptRoute): string {
  const canonical = route.path === "/" ? `${SITE}/` : `${SITE}${route.path}`;
  let out = setTitle(html, route.title);
  out = setMeta(out, "name", "description", route.description);
  out = setCanonical(out, canonical);
  out = setMeta(out, "property", "og:url", canonical);
  out = setMeta(out, "property", "og:title", route.ogTitle);
  out = setMeta(out, "property", "og:description", route.description);
  out = setMeta(out, "name", "twitter:title", route.ogTitle);
  out = setMeta(out, "name", "twitter:description", route.description);
  out = injectNoscript(out, route.bodyHtml);
  out = injectFaqJsonLd(out, route);
  return out;
}

export function noscriptPrerenderPlugin(): Plugin {
  return {
    name: "stackapps-noscript-prerender",
    apply: "build",
    async closeBundle() {
      const outDir = path.resolve(import.meta.dirname, "..", "dist", "public");
      const templatePath = path.join(outDir, "index.html");
      const template = await readFile(templatePath, "utf-8");

      for (const route of NOSCRIPT_ROUTES) {
        const base = route.path === "/" ? template : stripGraphFaqPage(template);
        const html = applyRouteMeta(base, route);
        const relPath = routeToFilePath(route.path);
        const destPath = path.join(outDir, relPath);
        await mkdir(path.dirname(destPath), { recursive: true });
        await writeFile(destPath, html, "utf-8");
      }
    },
  };
}
