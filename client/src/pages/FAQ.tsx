import { useEffect } from 'react';
import { Link } from 'wouter';
import { SiteFooter } from '@/components/SiteFooter';
import { setPageSeo } from '@/utils/seo';

export default function FAQ() {
  useEffect(() => {
    setPageSeo(
      'StackApps FAQ — AIEO/GEO readiness scans and AI discoverability',
      'Answers about StackApps: free technical audits, what crawlers can discover about your app, the vetted registry, StackApps Verified, StackLaunch, privacy, and accounts.',
    );
  }, []);

  const faqs = [
    {
      question: 'What is StackApps?',
      answer:
        'StackApps is primarily a free AIEO/GEO (AI Engine Optimization / Generative Engine Optimization) technical audit for indie SaaS founders and technical builders: run an automated check on your live app URL to see what search engines and AI crawlers can discover. Results surface on your public StackApps page — The Stackhouse is the proof layer (backlink, badge, reviews), not the whole product story.',
    },
    {
      question: 'How will getting my app verified here help me sell it?',
      answer:
        'Three ways. First, proof: the technical audit shows you cleared the bar for AI-ready discoverability. Second, credibility: a live-approved app gets a crawler-visible proof page that AI systems like Perplexity and ChatGPT-search can find and cite, plus an embeddable StackApps Verified badge for your own site. Third, evaluators browse verified apps on The Stackhouse — builders and early adopters looking for tools in your category. The readiness scan checks whether the signals AI crawlers actually look for are in place — llms.txt, robots.txt, sitemap.xml, and more. Most builders skip these and wonder why AI tools cannot find them. Once you clear the bar on the audit, the most important question before investing more time or money is whether there is actually a market for it — and if so, what direction makes it most marketable. That is where StackLaunch starts. stacklaunch.app',
    },
    {
      question: 'What is AIEO/GEO?',
      answer:
        'AIEO/GEO combines AI Engine Optimization with Generative Engine Optimization — optimizing how machines (search and AI crawlers) can find, parse, and cite your product in generative and answer interfaces. Where SEO optimizes for traditional search rankings, AIEO/GEO optimizes for how AI systems discover and summarize what you build. If AI cannot discover or summarize you accurately, you effectively do not exist in the answer-engine era.',
    },
    {
      question: 'What does the scan check?',
      answer:
        'One technical audit, grouped with one-line explanations each. Discoverability & crawl health: Site reachable (URL loads and returns usable HTML); robots.txt (crawler rules file exists); sitemap.xml (URL inventory for crawlers); llms.txt (machine-oriented site map for AI systems). Understandable to machines: FAQ presence (dedicated FAQ route/page); Blueprint Protocol (blueprint.txt with declared agent flows + stable selectors). Installable / mobile-ready: Android PWA (web app manifest with display intent); iOS PWA (Apple web-app meta); Service worker (offline/install path); Viewport meta (mobile rendering).',
    },
    {
      question: 'What is MCP?',
      answer:
        'MCP (Model Context Protocol) is an emerging standard for connecting AI clients to tools and data in a structured way. Your app does not need MCP to pass the StackApps scan; the scan measures crawler-visible signals (llms.txt, blueprint, PWA, etc.) that make you legible to search and AI systems.',
    },
    {
      question: 'What is CLI availability?',
      answer:
        'CLI availability means your product offers a command-line interface or scriptable entry point beyond the browser UI — useful for power users and automation. StackApps does not require a CLI; it is an optional signal some technical products publish for operator-style workflows.',
    },
    {
      question: 'What is Blueprint Protocol?',
      answer:
        'Blueprint Protocol is a plaintext contract (blueprint.txt) that tells AI agents how your app is meant to behave: capabilities, auth, and step-by-step flows with stable selectors. Think of it as a bonus signal: if it is present, agents can operate your product more reliably instead of guessing. https://github.com/Explorer-64/blueprint-protocol',
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
        'Yes. Browsing verified apps on The Stackhouse and getting your app into the registry is free. When an app is approved as live, StackApps also provides the proof-page backlink, embeddable StackApps Verified badge, and Site Readiness scan for free. Optional paid tiers may exist on individual products on their own domains.',
    },
    {
      question: 'How does the registry and moderation work?',
      answer:
        'Approved apps appear in The Stackhouse vetted registry with search, categories, and tags. New submissions go through moderation: automated checks on URLs plus human review for quality and fit. Apps can be approved as building, but the backlink, StackApps Verified badge, and readiness scan activate only when the app is approved as live.',
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
        'A live-approved app receives a server-rendered proof page at stackapps.app/apps/[slug] with a crawler-visible backlink to the live app URL, an embeddable StackApps Verified badge at /api/badge/[appId].svg, and a 12-point Site Readiness scan.',
    },
    {
      question: 'Is there a review process?',
      answer:
        'Yes. Submissions are reviewed for quality and relevance. Building apps may be approved as works in progress. Fully live apps can be approved as live, which activates the backlink, badge, and readiness scan.',
    },
    {
      question: 'What is Approved as Building vs Approved as Live?',
      answer:
        'Approved as Building means the app can appear as a work in progress, but it does not receive the backlink, StackApps Verified badge, or readiness scan yet. When the app is finished, the owner can request live review. Approved as Live unlocks those public proof surfaces.',
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
