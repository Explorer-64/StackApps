import { useEffect } from 'react';
import { Link } from 'wouter';
import { SiteFooter } from '@/components/SiteFooter';
import { setPageSeo } from '@/utils/seo';

export default function FAQ() {
  useEffect(() => {
    setPageSeo(
      'StackApps FAQ — AIEO/GEO readiness scans and AI discoverability',
      'Answers about StackApps: free technical audits, twelve readiness checks, guides (/guides), first-party CLI and MCP for the public scan, Bronze/Silver/Gold tiers, the live-approved embed badge, The Stackhouse, StackLaunch, privacy, and accounts.',
    );
  }, []);

  const faqs = [
    {
      question: 'What is StackApps?',
      answer:
        'StackApps is first a free, open-source technical audit: twelve concrete signals for whether search and AI systems can find, read, and hook into your live app (Lighthouse-style, for crawl and agent discovery). When you list and go live, you also get public proof on The Stackhouse (page, embed badge, tiers, reviews). The scan and methodology are the core story; the registry is curated credibility — not a generic AI link directory.',
    },
    {
      question: 'How is StackApps different from other AI directories or GEO tools?',
      answer:
        'We lead with inspectable compliance: every check ships in public GitHub, not a black-box score. The Stackhouse is human-moderated and tied to that audit on your listing — we are not selling paid placement or opaque "AI submission" volume. Many competitors stop at llms.txt generation or marketing GEO reports; we publish the same scanner we run in production and separate live registry status from Bronze/Silver/Gold readiness tiers.',
    },
    {
      question: 'How will getting my app verified here help me sell it?',
      answer:
        'Three ways. First, proof: the twelve-point technical audit shows what search and AI systems can actually see (and your listing shows a Bronze, Silver, or Gold readiness tier from those checks). Second, credibility: a live-approved app gets a crawler-visible proof page that AI systems can find and cite, plus an embeddable SVG badge that says StackApps Verified — that badge reflects live registry approval, not the same thing as hitting every check. Third, evaluators browse The Stackhouse for tools in your category. Most builders skip llms.txt, robots, and sitemap and wonder why AI tools cannot find them. Once you clear the crawl baseline, the next question is market fit — that is where StackLaunch starts. stacklaunch.app',
    },
    {
      question: 'What is AIEO/GEO?',
      answer:
        'AIEO/GEO combines AI Engine Optimization with Generative Engine Optimization — optimizing how machines (search and AI crawlers) can find, parse, and cite your product in generative and answer interfaces. Where SEO optimizes for traditional search rankings, AIEO/GEO optimizes for how AI systems discover and summarize what you build. If AI cannot discover or summarize you accurately, you effectively do not exist in the answer-engine era.',
    },
    {
      question: 'What does the scan check?',
      answer:
        'Twelve automated checks (score 12/12 if all pass). Discoverability: site reachable; robots.txt; sitemap.xml; llms.txt. Machine & operator signals: FAQ page (/faq); Blueprint Protocol (blueprint.txt); MCP (documented or HTML hints); CLI (common install patterns in page or docs). PWA / mobile: Android installability-style manifest; iOS web-app meta; service worker; viewport meta. Listings show Bronze / Silver / Gold tiers from subsets of these checks; PWA Ready is a separate badge. Each row on your listing has a ? popover explaining the check. Short scanner-aligned write-ups live at https://stackapps.app/guides (llms.txt, /faq, and CLI/Silver).',
    },
    {
      question: 'Where are the StackApps guides?',
      answer:
        'Public guides index: https://stackapps.app/guides — three articles in order: llms.txt (https://stackapps.app/guides/llms-txt), FAQ at /faq (https://stackapps.app/guides/faq), and CLI vs Silver tier (https://stackapps.app/guides/cli-silver). They match what the open-source scanner does, not aspirational behavior.',
    },
    {
      question: 'Does StackApps ship its own CLI or MCP for the scan?',
      answer:
        'Yes. The same public scan you get on https://stackapps.app/scan is available from a first-party CLI (`stackapps-cli`, command `stackapps scan <url>`) and a stdio MCP server (`stackapps-mcp`, tool `readiness_scan` with a full https URL). Source lives under `packages/stackapps-cli` and `packages/stackapps-mcp` in the GitHub repo; install paths and clone/local build notes are in https://stackapps.app/llms.txt under “First-party CLI & MCP”. After npm publish, `npx stackapps-cli` / `npx stackapps-mcp` work like any other Node tools.',
    },
    {
      question: 'What are Bronze, Silver, and Gold?',
      answer:
        'They are readiness tiers on your listing, derived from the twelve checks. Bronze means you pass the discoverability baseline (site reachable, llms.txt, robots.txt, sitemap.xml). Silver adds CLI signals, FAQ page, and viewport meta on top of Bronze. Gold adds MCP and blueprint.txt on top of Silver. The embeddable SVG badge saying StackApps Verified is separate: it reflects live approval, not which tier you reached.',
    },
    {
      question: 'What is MCP?',
      answer:
        'MCP (Model Context Protocol) is an emerging standard for connecting AI clients to tools and data in a structured way. StackApps scores MCP as one of twelve checks. You do not need MCP for Bronze or Silver, but you do need MCP (plus blueprint) to reach Gold. The scan looks for MCP in HTML or documented install hints (e.g. in llms.txt or blueprint.txt).',
    },
    {
      question: 'What is CLI availability?',
      answer:
        'CLI availability means we detect common install or run commands (npx, npm -g, brew, pipx, uvx, etc.) in your page or linked docs files. It is one of twelve checks. Bronze does not require CLI; Silver does (together with baseline, FAQ page, and viewport).',
    },
    {
      question: 'What is Blueprint Protocol?',
      answer:
        'Blueprint Protocol is a plaintext contract (blueprint.txt) that tells AI agents how your app is meant to behave: capabilities, auth, and step-by-step flows with stable selectors. It is one of twelve scored checks and is required for Gold (together with MCP). https://github.com/Explorer-64/blueprint-protocol',
    },
    {
      question: 'What is StackLaunch?',
      answer:
        'StackLaunch is the paid next step after the StackApps technical audit. It starts with market viability — is there actually demand for your app, and what direction makes it more marketable? That answer matters before you invest more time or money in optimization or promotion. From there, StackLaunch goes deeper: AIEO/GEO analysis, app and agent testing, and ongoing promotion. stacklaunch.app',
    },
    {
      question: 'Is StackApps open source?',
      answer:
        'Yes. https://github.com/Explorer-64/StackApps — every check in the scan is inspectable; scoring is not a black box.',
    },
    {
      question: 'Is StackApps free?',
      answer:
        'Yes. Browsing The Stackhouse and getting your app into the registry is free. When an app is approved as live, StackApps also provides the proof-page backlink, embeddable SVG badge (StackApps Verified when live), twelve-point Site Readiness scan, and tier labels on the listing for free. Optional paid tiers may exist on individual products on their own domains.',
    },
    {
      question: 'How does the registry and moderation work?',
      answer:
        'Approved apps appear in The Stackhouse vetted registry with search, categories, and tags. New submissions go through moderation: automated checks on URLs plus human review for quality and fit. Apps can be approved as building, but the backlink, embed badge, and full Site Readiness scan on the listing activate when the app is approved as live.',
    },
    {
      question: 'Is my data private?',
      answer:
        'We collect what you provide when you sign in (for example email and display name), content you submit (apps, reviews), and data needed to run the service, stored with Firebase as described in our Privacy Policy. We do not sell your personal information. Read the full details on the Privacy page.',
    },
    {
      question: 'Can I export my data?',
      answer:
        'Your reviews and ratings are tied to your StackApps account. For a copy of personal data we hold or to request deletion, contact support@stackapps.app. Data for each product (invoices, customers, etc.) lives with that product on its own site—export there if the app offers it.',
    },
    {
      question: 'How do I get my app verified?',
      answer:
        "Sign in with Google or email, open The Stackhouse from the hub, and use Submit New App. Add your app's name, description, URL, thumbnail, category, and tags.",
    },
    {
      question: 'What do live-approved apps receive?',
      answer:
        'A live-approved app receives a server-rendered proof page at stackapps.app/apps/[slug] with a crawler-visible backlink to the live app URL, an embeddable badge at /api/badge/[appId].svg (label StackApps Verified for live listings, plus x/12 score in the artwork), and a twelve-check Site Readiness section with Bronze / Silver / Gold tiers and a separate PWA badge.',
    },
    {
      question: 'Is there a review process?',
      answer:
        'Yes. Submissions are reviewed for quality and relevance. Building apps may be approved as works in progress. When approved as live, the backlink, embed badge, full twelve-check scan, and tier labels activate on the listing.',
    },
    {
      question: 'What is Approved as Building vs Approved as Live?',
      answer:
        'Approved as Building means the app can appear as a work in progress, but it does not receive the backlink, live embed badge state, or full readiness scan on the listing yet. When the app is finished, the owner can request live review. Approved as Live unlocks those public proof surfaces.',
    },
    {
      question: "Can I submit an app that's still under development?",
      answer:
        "Yes. MVPs and works-in-progress are welcome. You can indicate when something is still building so visitors know what to expect.",
    },
    {
      question: 'How does the rating system work?',
      answer:
        'Signed-in users can rate registry entries from one to five stars and leave a short review. Averages and counts show on each card and detail page.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cyber-black">
      <header className="bg-cyber-black/80 backdrop-blur-md border-b border-cyber-light sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple" data-testid="link-home">
              StackApps
            </Link>
            <Link href="/" className="text-neon-blue hover:text-white font-medium transition-colors" data-testid="link-back">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-8" data-testid="text-faq-title">Frequently Asked Questions</h1>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-cyber-gray border border-cyber-light rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-3">{faq.question}</h2>
              <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
