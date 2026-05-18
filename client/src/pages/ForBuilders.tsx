import { useEffect } from 'react';
import { Link } from 'wouter';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { setPageSeo } from '@/utils/seo';
import {
  Users,
  Search,
  TrendingUp,
  Heart,
  Gift,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';

export default function ForBuilders() {
  useEffect(() => {
    setPageSeo(
      'For builders — Open AI crawl audit & public proof on The Stackhouse',
      'StackApps leads with a free, open-source twelve-signal technical audit. List for free; when live-approved you get public proof (canonical page, embed badge, tiers) — curated credibility, not a generic AI directory.',
    );
  }, []);

  const benefits = [
    {
      icon: Users,
      label: 'The audience is pre-qualified',
      description:
        'Visitors are actively escaping bloated software. They\'re not browsing for fun — they\'re looking to switch.',
    },
    {
      icon: Search,
      label: 'Canonical proof in HTML',
      description:
        'Live-approved apps get an SSR page at stackapps.app/apps/[slug] with your real URL in the document — for discovery and citations, not a paid directory slot.',
    },
    {
      icon: TrendingUp,
      label: 'A technical audit that points somewhere useful',
      description:
        'We audit twelve signals: crawl health, llms.txt, FAQ, blueprint, MCP, CLI, PWA basics, viewport, and more — with tier labels on your listing.',
    },
    {
      icon: Heart,
      label: 'A badge you can embed',
      description:
        'Owners copy embed code for an SVG that shows StackApps Verified when the listing is live-approved; it links back to your public proof page.',
    },
    {
      icon: Gift,
      label: 'Free audit. Always.',
      description:
        'The scan and methodology stay free and inspectable on GitHub. Browse is curated, not pay-to-rank.',
    },
  ] as const;

  const audiences = [
    {
      title: 'Indie SaaS founders',
      body: 'Shipping browser-ready tools and want AI crawlers to actually find and recommend them.',
    },
    {
      title: 'Technical builders',
      body: 'Building composable stacks tool by tool. Not locked into one platform.',
    },
    {
      title: 'Developer-led startups',
      body: 'Want distribution without paying for 20% of what enterprise tools actually do.',
    },
  ] as const;

  const approved = [
    'Does one thing well',
    'Works in the browser — mobile-friendly, no mandatory download',
    'Built by a real person or small indie team',
    'Honest pricing — free tier, flat rate, or usage-based. No "contact us for pricing."',
  ] as const;

  const rejected = [
    'Bloatware and feature-stuffed all-in-one platforms',
    'Enterprise tools dressed as indie tools',
    'Any tool that asks users to share, paste, or submit their code — full stop. We don\'t promote platforms that take your code, period.',
  ] as const;

  const steps = [
    {
      n: 1,
      title: 'Apply',
      body: 'Fill out the form. Name, description, URL, category, screenshot. 5 minutes.',
    },
    {
      n: 2,
      title: 'Review',
      body: 'AI pre-screens, then a human reviews. Usually within 48 hours.',
    },
    {
      n: 3,
      title: 'Approved as live',
      body: 'Your app clears moderation as live: canonical SSR proof page at stackapps.app/apps/[slug] (real URL in HTML for crawlers), embeddable badge, and twelve-signal scan with tier labels on the listing.',
    },
    {
      n: 4,
      title: 'Improve or promote',
      body: 'Failed checks point to StackLaunch AIEO/GEO for a fix list. A clean score points to StackLaunch Market Viability before promotion.',
    },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-cyber-black">
      <NavBar activePage="for-builders" />

      <section className="relative overflow-hidden border-b border-cyber-light">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-neon-blue/10 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 md:pt-20 md:pb-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.08] [text-shadow:0_0_40px_rgba(0,243,255,0.25)]">
              Ship AI-era crawl compliance first. Earn public proof on The Stackhouse when you list.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-400 leading-relaxed">
              The product is an <span className="text-gray-200 font-semibold">open, auditable</span> readiness scan (same checks on GitHub). The Stackhouse is human-moderated visibility for browser-ready tools — so agents and buyers see a vetted signal, not another paid directory listing.
            </p>
            <Link
              href="/hub"
              className="mt-10 inline-flex justify-center items-center px-8 py-3.5 bg-neon-blue text-black font-bold rounded-sm uppercase tracking-wide shadow-[0_0_24px_rgba(0,243,255,0.45)] hover:shadow-[0_0_32px_rgba(0,243,255,0.6)] hover:bg-white transition-all"
              data-testid="button-submit-app-hero"
            >
              Submit Your App — It&apos;s Free
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-cyber-light bg-cyber-dark/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <h2 className="text-2xl md:text-3xl font-bold text-white">What you get for free.</h2>
          <p className="mt-4 text-gray-400 text-lg max-w-3xl leading-relaxed">
            Anyone can run the free scan; listing adds moderated proof (page, badge, tiers on record). StackLaunch is the separate path when you want fixes, viability, or promotion help.
          </p>
          <div className="mt-12 space-y-10">
            {benefits.map(({ icon: Icon, label, description }) => (
              <div key={label} className="flex gap-4 md:gap-6">
                <div className="flex-shrink-0 inline-flex rounded-md border border-neon-blue/40 bg-neon-blue/10 p-3 text-neon-blue h-fit">
                  <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{label}</h3>
                  <p className="mt-2 text-gray-400 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-cyber-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Who&apos;s finding your app here?</h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {audiences.map(({ title, body }) => (
              <div
                key={title}
                className="rounded-lg border border-cyber-light bg-cyber-black/60 p-6 md:p-8 shadow-[0_0_0_1px_rgba(0,243,255,0.06)]"
              >
                <h3 className="text-lg font-bold text-neon-green">{title}</h3>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-gray-300 max-w-3xl leading-relaxed">
            These aren&apos;t enterprise procurement committees. They make a decision in 10 minutes and they tell their network.
          </p>
        </div>
      </section>

      <section className="border-b border-cyber-light bg-cyber-dark/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="rounded-lg border border-cyber-light bg-cyber-black/60 p-6 md:p-10 shadow-[0_0_0_1px_rgba(0,243,255,0.06)] max-w-3xl">
            <div className="flex gap-4 md:gap-6">
              <div className="flex-shrink-0 inline-flex rounded-md border border-neon-purple/40 bg-neon-purple/10 p-3 text-neon-purple h-fit shadow-[0_0_12px_rgba(168,85,247,0.2)]">
                <FileText className="h-6 w-6" strokeWidth={2} aria-hidden />
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Make your app AI-agent ready</h2>
                <p className="mt-4 text-gray-400 leading-relaxed">
                  <span className="text-gray-300 font-medium">Blueprint Protocol</span> is an open standard: you publish a plain-text{' '}
                  <span className="text-gray-300 font-medium">blueprint.txt</span> that tells AI agents what your product can do and how to use it—supported capabilities,
                  inputs, and stable UI hooks—so assistants help people correctly instead of guessing your routes and forms. It’s a bonus signal: if you add it, agents can complete key tasks more reliably. Most teams can ship a first version in under 10 minutes.
                </p>
                <p className="mt-6">
                  <a
                    href="https://github.com/Explorer-64/blueprint-protocol"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-neon-blue font-semibold hover:text-neon-green transition-colors"
                  >
                    Read the spec →
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-cyber-light bg-cyber-dark/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <h2 className="text-2xl md:text-3xl font-bold text-white">We&apos;re opinionated. Here&apos;s what gets approved.</h2>
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <ul className="space-y-4">
                {approved.map((line) => (
                  <li key={line} className="flex gap-3 text-gray-300">
                    <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-neon-green" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <ul className="space-y-4">
                {rejected.map((line) => (
                  <li key={line} className="flex gap-3 text-gray-400">
                    <XCircle className="h-6 w-6 flex-shrink-0 text-red-500/90" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-cyber-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <h2 className="text-2xl md:text-3xl font-bold text-white">How it works</h2>
          <ol className="mt-10 space-y-8 max-w-3xl">
            {steps.map(({ n, title, body }) => (
              <li key={n} className="flex gap-4">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm border border-neon-blue/50 bg-neon-blue/10 text-neon-blue font-bold">
                  {n}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white">{title}</h3>
                  <p className="mt-2 text-gray-400 leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="relative overflow-hidden rounded-xl border border-cyber-light bg-cyber-dark px-8 py-12 md:px-12 md:py-16 text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-green/5 to-neon-blue/5 pointer-events-none" />
            <div className="relative max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-white">Run the open audit. List when you want proof.</h2>
              <p className="mt-4 text-gray-400 text-base md:text-lg leading-relaxed">
                Start on /scan or list from the hub. StackLaunch stays the paid path for fixes, deeper AIEO work, and market viability — separate product, clear boundary.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/hub"
                  className="inline-flex justify-center items-center px-8 py-3.5 bg-neon-blue text-black font-bold rounded-sm uppercase tracking-wide shadow-[0_0_24px_rgba(0,243,255,0.45)] hover:bg-white transition-all w-full sm:w-auto"
                  data-testid="button-submit-closing"
                >
                  Submit Your App — Free
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex justify-center items-center px-8 py-3.5 border-2 border-neon-blue text-neon-blue font-bold rounded-sm uppercase tracking-wide hover:bg-neon-blue/10 transition-all w-full sm:w-auto"
                  data-testid="button-browse-closing"
                >
                  Browse The Stackhouse →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
