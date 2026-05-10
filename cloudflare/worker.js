/**
 * Cloudflare Worker — /app/[id] metadata injection
 *
 * Problem: /app/[id] pages load content from Firebase client-side.
 * AI crawlers (GPTBot, PerplexityBot, Google-Extended) don't execute JS,
 * so they see a blank page with no title, description, or JSON-LD.
 *
 * Solution: Intercept /app/* requests, fetch the app doc from Firestore
 * REST API, inject metadata into the raw HTML before returning to the crawler.
 * Human users are unaffected — React still hydrates normally.
 */

const FIRESTORE_PROJECT = 'stackapps-dcab1';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents`;

function normalizePath(path) {
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path || '/';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = normalizePath(url.pathname);

    if (path === '/manage-app') {
      return Response.redirect(new URL('/dashboard', url.origin), 301);
    }

    if (path === '/app-details') {
      const id = url.searchParams.get('id');
      if (id) {
        return Response.redirect(
          new URL(`/app/${encodeURIComponent(id)}`, url.origin),
          301,
        );
      }
      return Response.redirect(new URL('/dashboard', url.origin), 301);
    }

    // Only intercept /app/[id] routes — pass everything else through unchanged
    const match = path.match(/^\/app\/([^/]+)$/);
    if (!match) {
      return fetch(request);
    }

    const appId = match[1];

    // Fetch app doc from Firestore and origin HTML in parallel
    const [appRes, htmlRes] = await Promise.all([
      fetch(`${FIRESTORE_BASE}/apps/${appId}`),
      fetch(request),
    ]);

    // If the app doc doesn't exist or errors, serve the page as-is
    if (!appRes.ok) {
      return htmlRes;
    }

    const appData = await appRes.json();

    // Firestore REST API returns fields in typed format: { fieldName: { stringValue: "..." } }
    const f = appData.fields ?? {};
    const name = f.name?.stringValue ?? 'The Stackhouse';
    const description = f.description?.stringValue ?? '';
    const appUrl = f.appUrl?.stringValue ?? '';
    const category = f.category?.stringValue ?? 'Utilities';
    const thumbnailUrl = f.thumbnailUrl?.stringValue ?? '';
    const averageRating = f.averageRating?.doubleValue ?? f.averageRating?.integerValue ?? null;
    const ratingCount = f.ratingCount?.integerValue ?? null;
    const tags = (f.tags?.arrayValue?.values ?? [])
      .map(v => v.stringValue)
      .filter(Boolean)
      .join(', ');

    // Firestore security rules only allow `get` on approved docs — if moderationStatus
    // isn't approved the REST API returns a permission-denied error (caught above via !appRes.ok)
    // so we don't need to re-check here.

    const safeDesc = description.replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const safeName = name.replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const canonicalUrl = `https://stackapps.app/app/${appId}`;

    const ratingSchema = averageRating && ratingCount
      ? `,"aggregateRating":{"@type":"AggregateRating","ratingValue":"${averageRating}","reviewCount":"${ratingCount}"}`
      : '';

    const injected = `
    <title>${safeName} — The Stackhouse by StackApps</title>
    <meta name="description" content="${safeDesc.slice(0, 160)}">
    <link rel="canonical" href="${canonicalUrl}">
    <meta property="og:title" content="${safeName} — The Stackhouse">
    <meta property="og:description" content="${safeDesc.slice(0, 200)}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:type" content="website">
    ${thumbnailUrl ? `<meta property="og:image" content="${thumbnailUrl}">` : ''}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeName} — The Stackhouse">
    <meta name="twitter:description" content="${safeDesc.slice(0, 200)}">
    ${thumbnailUrl ? `<meta name="twitter:image" content="${thumbnailUrl}">` : ''}
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "${safeName}",
      "description": "${safeDesc}",
      "url": "${appUrl}",
      "applicationCategory": "${category}",
      "operatingSystem": "Web Browser",
      "offers": { "@type": "Offer", "price": "0" }
      ${ratingSchema}
    }
    </script>`;

    const html = await htmlRes.text();

    // Remove the existing generic <title> and inject our enriched head content
    const enriched = html
      .replace(/<title>[^<]*<\/title>/, '')
      .replace('</head>', injected + '\n  </head>');

    return new Response(enriched, {
      status: htmlRes.status,
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        'cache-control': 'public, max-age=300', // cache 5 min — fresh enough for listings
      },
    });
  },
};
