export type NoscriptRoute = {
  path: string;
  title: string;
  description: string;
  ogTitle: string;
  bodyHtml: string;
  faqJsonLd?: Array<{ question: string; answer: string }>;
};

const SITE = "https://stackapps.app";

export const NOSCRIPT_ROUTES: NoscriptRoute[] = [
  {
    path: "/",
    title: "StackApps — Open-source AI & crawl readiness audit (Lighthouse for the agent era)",
    description:
      "Free twelve-check technical audit: what search and AI systems can discover and operate. Every check is on GitHub. The Stackhouse is human-reviewed public proof when you list — not a generic AI directory.",
    ogTitle: "StackApps — Where apps prove they're AI-ready",
    bodyHtml: `
<article>
  <h1><span>We build to be found and cited.</span> <span>You can too.</span></h1>
  <p>StackApps is the Lighthouse for the agent era: a free, open-source twelve-signal technical audit that measures whether search engines and AI crawlers can find, read, and operate your live app. Start with a free scan, then publish the signals agents actually read.</p>
  <p>"Found and cited" means legible, stable facts — not traffic guarantees. The product leads with inspectable compliance on GitHub; The Stackhouse is a human-moderated proof layer for listings that clear review.</p>

  <h2>Proof surfaces on top of the audit</h2>
  <p>When your listing goes live on The Stackhouse, you unlock canonical proof in HTML, an embeddable StackApps Verified badge, and a twelve-point readiness scan with Bronze, Silver, and Gold tier labels. These surfaces sit on top of the same open methodology we publish in our GitHub repo — not a black-box GEO score.</p>
  <p>Live-approved listings get a server-rendered page with your real app URL in the document for evaluators and crawlers. The embed badge reflects live registry approval; tier labels summarize how many automated checks pass.</p>

  <h2>Compliance, not another AI link directory</h2>
  <p>The market is full of low-signal directories and opaque GEO widgets. StackApps leads with a public, forkable checklist so founders and agencies can defend the score. The Stackhouse is a curated layer for apps that clear moderation — proof, not pay-to-list noise.</p>
  <p>Anyone can <a href="${SITE}/scan">run the free readiness scan</a> on a live URL without signing in. Builders who want moderated visibility can read <a href="${SITE}/for-builders">how listing on The Stackhouse works</a>, then browse <a href="${SITE}/dashboard">verified indie apps with public proof</a>.</p>

  <h2>How it works</h2>
  <h3>Start free</h3>
  <p>Get your browser-ready app in the queue for human review. Run the scan first to see which of twelve checks pass today.</p>
  <h3>Go live</h3>
  <p>Live approval turns on public proof: canonical page, embed badge, and scan on your listing.</p>
  <h3>Ask before you invest more</h3>
  <p>Once you clear the bar on the audit, find out if there is actually a market for it — before you spend another hour building. StackLaunch (stacklaunch.app) is the separate paid path for market viability and deeper AIEO work.</p>

  <h2>Frequently asked questions</h2>
  <h3>What is StackApps?</h3>
  <p>StackApps is first a free, open-source technical audit: twelve concrete signals for whether search and AI systems can find, read, and hook into your live app. When you list and go live, you also get public proof on The Stackhouse. The scan and methodology are the core story; the registry is curated credibility.</p>
  <h3>What does the scan check?</h3>
  <p>Twelve automated checks: site reachable, robots.txt, sitemap.xml, llms.txt, FAQ at /faq, Blueprint Protocol, MCP, CLI, Android PWA manifest, iOS web-app meta, service worker, and viewport meta. See the full <a href="${SITE}/faq">FAQ</a> or our <a href="${SITE}/guides">scanner-accurate guides</a>.</p>
  <h3>Is StackApps free?</h3>
  <p>Yes. Browsing The Stackhouse and running the public scan are free. When an app is approved as live, StackApps provides the proof-page backlink, embeddable badge, twelve-point Site Readiness scan, and tier labels on the listing for free.</p>
  <h3>What are Bronze, Silver, and Gold?</h3>
  <p>Readiness tiers derived from the twelve checks. Bronze is discoverability baseline. Silver adds CLI, FAQ page, and viewport. Gold adds MCP and blueprint.txt. The embeddable SVG badge is separate and reflects live approval.</p>
  <h3>Where can I learn more?</h3>
  <p>Read our <a href="${SITE}/guides/llms-txt">llms.txt guide</a>, <a href="${SITE}/guides/faq">/faq guide</a>, and <a href="${SITE}/guides/cli-silver">CLI &amp; Silver tier guide</a>. Open source: <a href="https://github.com/Explorer-64/StackApps">github.com/Explorer-64/StackApps</a>.</p>
</article>`,
    faqJsonLd: [
      {
        question: "What is StackApps?",
        answer:
          "StackApps is a free, open-source technical audit with twelve signals for whether search and AI systems can find, read, and hook into your live app, plus optional public proof on The Stackhouse when you list.",
      },
      {
        question: "What does the scan check?",
        answer:
          "Twelve automated checks: site reachable, robots.txt, sitemap.xml, llms.txt, FAQ at /faq, Blueprint Protocol, MCP, CLI, PWA signals, and viewport meta.",
      },
      {
        question: "Is StackApps free?",
        answer:
          "Yes. Browsing The Stackhouse and running the public scan are free. Live-approved listings get proof pages, embed badges, and tier labels at no cost.",
      },
      {
        question: "What are Bronze, Silver, and Gold?",
        answer:
          "Readiness tiers from the twelve checks. Bronze is discoverability baseline. Silver adds CLI, FAQ, and viewport. Gold adds MCP and blueprint.txt.",
      },
      {
        question: "Where can I learn more?",
        answer:
          "Guides at stackapps.app/guides, full FAQ at stackapps.app/faq, and open source at github.com/Explorer-64/StackApps.",
      },
    ],
  },
  {
    path: "/for-builders",
    title: "For builders — Open AI crawl audit & public proof on The Stackhouse",
    description:
      "StackApps leads with a free, open-source twelve-signal technical audit. List for free; when live-approved you get public proof — curated credibility, not a generic AI directory.",
    ogTitle: "For builders — StackApps",
    bodyHtml: `
<article>
  <h1>Ship AI-era crawl compliance first. Earn public proof on The Stackhouse when you list.</h1>
  <p>The product is an open, auditable readiness scan with the same checks on GitHub. The Stackhouse is human-moderated visibility for browser-ready tools — so agents and buyers see a vetted signal, not another paid directory listing.</p>
  <p>Before you list, <a href="${SITE}/scan">run the free twelve-signal scan</a> on your live URL. The methodology is inspectable — not a black-box GEO widget. When you are ready for moderated proof, submit from the hub; live approval unlocks canonical HTML, an embed badge, and tier labels on your listing.</p>

  <h2>What you get for free</h2>
  <p>Anyone can run the free scan; listing adds moderated proof on record. StackLaunch is the separate path when you want fixes, viability, or promotion help.</p>
  <h3>The audience is pre-qualified</h3>
  <p>Visitors are actively escaping bloated software. They are looking to switch, not browsing for fun.</p>
  <h3>Canonical proof in HTML</h3>
  <p>Live-approved apps get a server-rendered page at stackapps.app/apps/[slug] with your real URL in the document — for discovery and citations.</p>
  <h3>A technical audit that points somewhere useful</h3>
  <p>We audit twelve signals: crawl health, llms.txt, FAQ, blueprint, MCP, CLI, PWA basics, and viewport. Read the <a href="${SITE}/guides">guides</a> to understand each check.</p>
  <h3>A badge you can embed</h3>
  <p>Live-approved listings get an SVG badge that says StackApps Verified and links to your public proof page.</p>

  <h2>Make your app AI-agent ready</h2>
  <p>Blueprint Protocol is an open standard: publish blueprint.txt that tells AI agents what your product can do and how to use it. Read the spec at <a href="https://github.com/Explorer-64/blueprint-protocol">github.com/Explorer-64/blueprint-protocol</a>.</p>

  <h2>How it works</h2>
  <ol>
    <li><strong>Apply</strong> — Name, description, URL, category, screenshot. About five minutes.</li>
    <li><strong>Review</strong> — AI pre-screens, then a human reviews. Usually within 48 hours.</li>
    <li><strong>Approved as live</strong> — Canonical SSR proof page, embeddable badge, and twelve-signal scan with tier labels.</li>
    <li><strong>Improve or promote</strong> — Failed checks point to StackLaunch AIEO/GEO. A clean score points to market viability before promotion.</li>
  </ol>
  <p>Browse <a href="${SITE}/dashboard">The Stackhouse</a> to see live examples, or read the <a href="${SITE}/faq">full FAQ</a> for tier and moderation details.</p>
</article>`,
  },
  {
    path: "/scan",
    title: "Free AI & crawl readiness scan — StackApps",
    description:
      "Open-source twelve-signal audit on your live URL. One free scan per domain. Sign in to see every check. Technical compliance first.",
    ogTitle: "Free AI & crawl readiness scan — StackApps",
    bodyHtml: `
<article>
  <h1>Can crawlers and agents actually use your site?</h1>
  <p>Same twelve checks we ship in open source — free, no sign-in to start. One scan per domain. Enter a full URL starting with https:// and run the scan to see your score out of twelve.</p>
  <p>The scan measures discoverability (robots.txt, sitemap.xml, llms.txt), machine-readable signals (FAQ at /faq, blueprint.txt, MCP, CLI), and PWA basics (manifest, iOS meta, service worker, viewport). Each check maps to code in our public GitHub repo.</p>

  <h2>What the twelve checks cover</h2>
  <p><strong>Discoverability:</strong> site reachable, robots.txt, sitemap.xml, llms.txt. <strong>Machine signals:</strong> FAQ page, Blueprint Protocol, MCP, CLI install patterns. <strong>PWA / mobile:</strong> Android manifest, iOS web-app meta, service worker, viewport meta.</p>
  <p>Sign in free to see exactly which checks fail and how to fix them. Cleared the crawl baseline? List on <a href="${SITE}/for-builders">The Stackhouse for free</a> for human review and public proof when live-approved.</p>

  <h2>Learn the checks</h2>
  <p>Read our scanner-accurate guides: <a href="${SITE}/guides">guides index</a>, <a href="${SITE}/guides/llms-txt">llms.txt</a>, <a href="${SITE}/guides/faq">/faq</a>, and <a href="${SITE}/guides/cli-silver">CLI &amp; Silver tier</a>. For operational details, see <a href="${SITE}/llms.txt">llms.txt</a> and <a href="${SITE}/.well-known/blueprint.txt">blueprint.txt</a>.</p>
</article>`,
  },
  {
    path: "/faq",
    title: "StackApps FAQ — AIEO/GEO readiness scans and AI discoverability",
    description:
      "Answers about StackApps: free technical audits, twelve readiness checks, guides, CLI and MCP, Bronze/Silver/Gold tiers, The Stackhouse, StackLaunch, privacy, and accounts.",
    ogTitle: "StackApps FAQ",
    bodyHtml: `
<article>
  <h1>Frequently Asked Questions</h1>

  <h2>What is StackApps?</h2>
  <p>StackApps is first a free, open-source technical audit: twelve concrete signals for whether search and AI systems can find, read, and hook into your live app. When you list and go live, you also get public proof on The Stackhouse. The scan and methodology are the core story; the registry is curated credibility — not a generic AI link directory.</p>

  <h2>How is StackApps different from other AI directories or GEO tools?</h2>
  <p>We lead with inspectable compliance: every check ships in public GitHub, not a black-box score. The Stackhouse is human-moderated and tied to that audit on your listing — we are not selling paid placement or opaque AI submission volume.</p>

  <h2>What is AIEO/GEO?</h2>
  <p>AIEO/GEO combines AI Engine Optimization with Generative Engine Optimization — optimizing how machines can find, parse, and cite your product in generative and answer interfaces. If AI cannot discover or summarize you accurately, you effectively do not exist in the answer-engine era.</p>

  <h2>What does the scan check?</h2>
  <p>Twelve automated checks: site reachable; robots.txt; sitemap.xml; llms.txt; FAQ page (/faq); Blueprint Protocol; MCP; CLI; Android PWA manifest; iOS web-app meta; service worker; viewport meta. Listings show Bronze / Silver / Gold tiers from subsets of these checks. Guides at <a href="${SITE}/guides">stackapps.app/guides</a>.</p>

  <h2>What are Bronze, Silver, and Gold?</h2>
  <p>Bronze means discoverability baseline (site reachable, llms.txt, robots.txt, sitemap.xml). Silver adds CLI, FAQ page, and viewport on top of Bronze. Gold adds MCP and blueprint.txt on top of Silver. The embeddable SVG badge is separate and reflects live approval.</p>

  <h2>Is StackApps free?</h2>
  <p>Yes. Browsing The Stackhouse and getting your app into the registry is free. Live-approved apps receive proof-page backlink, embed badge, twelve-point scan, and tier labels for free.</p>

  <h2>What is StackLaunch?</h2>
  <p>StackLaunch is the paid next step after the StackApps technical audit — market viability, deeper AIEO work, and promotion. stacklaunch.app</p>

  <h2>Is StackApps open source?</h2>
  <p>Yes. <a href="https://github.com/Explorer-64/StackApps">github.com/Explorer-64/StackApps</a> — every check in the scan is inspectable.</p>

  <h2>How do I get my app verified?</h2>
  <p>Sign in, open The Stackhouse from the hub, and use Submit New App. See <a href="${SITE}/for-builders">for builders</a> for the full flow, or <a href="${SITE}/scan">run a free scan</a> first.</p>
</article>`,
    faqJsonLd: [
      {
        question: "What is StackApps?",
        answer:
          "A free, open-source twelve-signal technical audit plus optional public proof on The Stackhouse when you list and go live.",
      },
      {
        question: "What does the scan check?",
        answer:
          "Twelve checks: crawl health, llms.txt, robots, sitemap, FAQ, blueprint, MCP, CLI, and PWA signals.",
      },
      {
        question: "Is StackApps free?",
        answer: "Yes. Browsing, scanning, and listing are free. Live proof surfaces are free when approved.",
      },
      {
        question: "What are Bronze, Silver, and Gold?",
        answer: "Readiness tiers from the twelve checks — Bronze baseline, Silver adds CLI/FAQ/viewport, Gold adds MCP/blueprint.",
      },
    ],
  },
  {
    path: "/dashboard",
    title: "The Stackhouse — vetted registry with public proof",
    description:
      "Browser-ready indie apps on StackApps: open twelve-signal readiness audits, tier labels, live embed badges, and canonical proof pages.",
    ogTitle: "The Stackhouse — StackApps",
    bodyHtml: `
<article>
  <h1>Verified indie apps with public proof.</h1>
  <p>The Stackhouse is a vetted registry of browser-ready indie tools, human-reviewed. Live apps show readiness scans (twelve checks, tier labels), embed badges, and crawler-visible proof pages at stackapps.app/apps/[slug].</p>
  <p>Each live-approved listing includes a server-rendered proof page with the maker's real app URL in HTML, an embeddable StackApps Verified badge, and Bronze / Silver / Gold readiness tiers derived from automated checks. Browse here to find tools; <a href="${SITE}/for-builders">list your own app free</a> when you are ready.</p>

  <h2>Vetted registry</h2>
  <p>Search verified live tools and approved works in progress. Categories and tags help evaluators find browser-ready software without enterprise bloat. Before listing, <a href="${SITE}/scan">run the free readiness scan</a> to see which checks pass today.</p>

  <h2>What live apps show</h2>
  <p>Twelve-point Site Readiness scan, tier labels (Bronze, Silver, Gold), separate PWA badge, user reviews, and links to each maker's live product. Proof pages are designed for crawlers and answer engines — not pay-to-rank placement.</p>
  <p>Questions about tiers or moderation? See the <a href="${SITE}/faq">FAQ</a> or our <a href="${SITE}/guides">guides</a>.</p>
</article>`,
  },
  {
    path: "/guides",
    title: "Guides — AI & crawl readiness — StackApps",
    description:
      "Short, scanner-accurate guides: llms.txt, /faq, CLI signals and the Silver tier. Same checks we ship in open source.",
    ogTitle: "Guides — StackApps",
    bodyHtml: `
<article>
  <h1>Ship what the scan actually measures</h1>
  <p>No black box: every check maps to code in our repo. These three notes cut confusion for builders who want Bronze, Silver, or Gold without guessing.</p>
  <ol>
    <li><a href="${SITE}/guides/llms-txt">llms.txt — your AI-era identity file</a> — Why /llms.txt exists, what belongs in it, and how our scan checks it.</li>
    <li><a href="${SITE}/guides/faq">FAQ at /faq — one stable URL for the agent era</a> — We probe exactly /faq with HEAD; how to pass without lying to humans.</li>
    <li><a href="${SITE}/guides/cli-silver">CLI check &amp; Silver tier</a> — CLI in our scan means documented install/run commands, not "ship a TUI".</li>
  </ol>
  <p>Run the <a href="${SITE}/scan">free scan</a> on your URL, then read the <a href="${SITE}/faq">FAQ</a> for tier and listing questions.</p>
</article>`,
  },
  {
    path: "/guides/llms-txt",
    title: "Guide: llms.txt for AI & crawler discovery — StackApps",
    description:
      "Why agents skip sites without /llms.txt, what to put in the file, and how StackApps verifies it with a HEAD request.",
    ogTitle: "Guide: llms.txt — StackApps",
    bodyHtml: `
<article>
  <h1>llms.txt — your AI-era identity file</h1>
  <p>/llms.txt is a small, plain-text file at the root of your site. Think of it as a business card for machines: who you are, what the product does, and where humans and agents should look next.</p>

  <h2>Why agents skip you without it</h2>
  <p>Crawlers and assistants already have your marketing page. They do not have a compact, factual map of intent, boundaries, and pointers to deeper docs. Without /llms.txt, everything becomes guesswork from layout and hero copy.</p>

  <h2>What StackApps actually checks</h2>
  <p>Our scanner issues HEAD to {yourAppUrl}/llms.txt and requires HTTP 200. That is the baseline check. We also GET the body for CLI and MCP hints when those files exist.</p>

  <h2>What to put in the file</h2>
  <p>Product name and one-line purpose, primary audience, links to docs/pricing/support, and optional install hints (npx, brew install) if real. Bronze tier requires reachable site plus robots.txt, sitemap.xml, and /llms.txt returning 200.</p>
  <p>See also: <a href="${SITE}/guides/faq">/faq guide</a>, <a href="${SITE}/guides/cli-silver">CLI &amp; Silver</a>, <a href="${SITE}/scan">free scan</a>.</p>
</article>`,
  },
  {
    path: "/guides/faq",
    title: "Guide: standardized /faq for StackApps readiness — StackApps",
    description:
      "Why a canonical FAQ URL matters for AI tools, how to implement or redirect /faq, and what our scanner actually checks.",
    ogTitle: "Guide: /faq — StackApps",
    bodyHtml: `
<article>
  <h1>FAQ at /faq — one stable URL for the agent era</h1>
  <p>Agents and crawlers benefit from one canonical Q&amp;A surface they can rely on: the same path every time, bookmarkable, cacheable, and easy to summarize. StackApps standardizes on /faq.</p>

  <h2>What we check</h2>
  <p>The scanner sends HEAD to {yourAppUrl}/faq and requires HTTP 200. We do not crawl for FAQ content in JSON-LD or random pages. The path is /faq relative to your listing URL.</p>

  <h2>How to implement</h2>
  <p>Ship a real FAQ route at /faq (SSR or static), redirect from another path as long as /faq ends on 200, or use a thin hub page that links to deeper docs. Silver tier requires Bronze plus FAQ at /faq, viewport meta, and CLI signal.</p>
  <p>Read the full <a href="${SITE}/faq">StackApps FAQ</a>, <a href="${SITE}/guides/llms-txt">llms.txt guide</a>, or <a href="${SITE}/scan">run a scan</a>.</p>
</article>`,
  },
  {
    path: "/guides/cli-silver",
    title: "Guide: CLI signal & Silver readiness tier — StackApps",
    description:
      "How StackApps detects CLI patterns in HTML, llms.txt, or blueprint.txt, and how that fits Silver tier.",
    ogTitle: "Guide: CLI & Silver — StackApps",
    bodyHtml: `
<article>
  <h1>CLI check &amp; Silver tier — automation entry points</h1>
  <p>In StackApps readiness, CLI available means documented automation entry points: common install or run commands a developer or script could execute. We score discoverability of those commands, not your architecture.</p>

  <h2>How the scanner detects it</h2>
  <p>We scan HTML of your root URL, then /llms.txt, then /blueprint.txt for patterns like npm install -g, npx, uvx, pipx, brew install, pip install, cargo install.</p>

  <h2>Silver tier</h2>
  <p>Bronze: reachable + llms.txt + robots.txt + sitemap.xml. Silver: Bronze + CLI + FAQ at /faq + viewport meta. Gold: Silver + MCP + blueprint.txt. If you are Bronze and stuck below Silver, compare FAQ, viewport, and command hints.</p>
  <p>Related: <a href="${SITE}/guides/llms-txt">llms.txt guide</a>, <a href="${SITE}/guides/faq">/faq guide</a>, <a href="${SITE}/faq">FAQ</a>, <a href="${SITE}/scan">free scan</a>.</p>
</article>`,
  },
  {
    path: "/privacy",
    title: "Privacy Policy — StackApps",
    description:
      "How StackApps collects, uses, scans, and stores account, listing, review, badge, and public readiness data.",
    ogTitle: "Privacy Policy — StackApps",
    bodyHtml: `
<article>
  <h1>Privacy Policy</h1>

  <h2>Information We Collect</h2>
  <p>When you use StackApps, we may collect email address and display name when you sign in, app submissions and related content, reviews and ratings, and public readiness scan results for submitted app URLs.</p>

  <h2>How We Use Your Information</h2>
  <p>We use collected information to provide and maintain our service, display app submissions in our directory, show reviews and ratings, check public app URLs and common public files (llms.txt, robots.txt, sitemap.xml, manifest.json, sw.js, FAQ pages, blueprint.txt), and display readiness results, tier labels, embed badge status, and scan scores on live-approved listings.</p>

  <h2>Data Storage</h2>
  <p>Your data is stored securely using Firebase services by Google. We implement appropriate security measures to protect your information.</p>

  <h2>Contact</h2>
  <p>If you have questions about this privacy policy, contact us through the platform or see our <a href="${SITE}/terms">Terms of Service</a> and <a href="${SITE}/faq">FAQ</a>.</p>
</article>`,
  },
  {
    path: "/terms",
    title: "Terms of Service — StackApps",
    description:
      "Rules for using StackApps: submissions, reviews, moderation, public readiness scans, live embed badges, backlinks, and limitations.",
    ogTitle: "Terms of Service — StackApps",
    bodyHtml: `
<article>
  <h1>Terms of Service</h1>

  <h2>Acceptance of Terms</h2>
  <p>By using StackApps, you agree to be bound by these Terms of Service. If you do not agree, please do not use our service.</p>

  <h2>User Responsibilities</h2>
  <p>You are responsible for content you submit, must only submit apps you own or have rights to share, agree not to submit harmful or illegal content, and reviews must be honest and relevant.</p>

  <h2>Moderation</h2>
  <p>All app submissions are subject to moderation. We reserve the right to approve, reject, or remove content. Backlinks, live embed badge, readiness scan results, and tier labels are available for apps approved as live.</p>

  <h2>Readiness Scans and Badges</h2>
  <p>By submitting an app URL, you allow StackApps to fetch public pages and files from that URL to produce readiness results. Scan results may be displayed publicly for live-approved listings.</p>

  <h2>Limitation of Liability</h2>
  <p>StackApps is provided as is without warranties. We are not responsible for damages arising from your use of our service or apps listed in our directory.</p>
  <p>See also: <a href="${SITE}/privacy">Privacy Policy</a>, <a href="${SITE}/faq">FAQ</a>, <a href="${SITE}/for-builders">For builders</a>.</p>
</article>`,
  },
];

export function routeToFilePath(routePath: string): string {
  if (routePath === "/") return "index.html";
  const trimmed = routePath.replace(/^\//, "").replace(/\/$/, "");
  return `${trimmed}/index.html`;
}

export function buildFaqJsonLd(faqs: Array<{ question: string; answer: string }>): string {
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
    null,
    2,
  );
}
