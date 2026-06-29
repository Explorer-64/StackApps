import { Link, useLocation } from 'wouter';
import { lazy, Suspense, useEffect, useState } from 'react';
import { setPageSeo } from '@/utils/seo';
import { useCurrentUser } from '@/hooks/use-current-user';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { LoadingScreen } from '@/components/LoadingScreen';
import { BadgeCheck, Bot, Link2, Radar, Rocket, SearchCheck, ShieldCheck, Sparkles } from 'lucide-react';

const HomeRegistryTeaser = lazy(() => import('@/components/HomeRegistryTeaser'));

function HomeRegistryTeaserSkeleton() {
  return (
    <div aria-busy="true">
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-8 w-1 rounded-sm bg-cyber-light/30" aria-hidden />
            <div className="h-4 w-40 rounded bg-cyber-light/20 animate-pulse" />
          </div>
          <div className="h-8 w-64 max-w-full rounded bg-cyber-light/15 animate-pulse" />
          <div className="h-4 w-full max-w-xl rounded bg-cyber-light/10 animate-pulse" />
        </div>
        <div className="rounded-2xl border border-cyber-light bg-cyber-dark px-4 py-3 min-w-[200px]">
          <div className="h-5 w-48 rounded bg-cyber-light/15 animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col items-center py-16 gap-3 min-h-[200px]">
        <div className="h-10 w-10 rounded-full border-2 border-cyber-light border-t-neon-blue animate-spin" />
        <p className="text-sm text-gray-500">Loading featured picks…</p>
      </div>
    </div>
  );
}

const builderPerks = [
  {
    icon: Link2,
    title: 'Canonical proof page (when live)',
    description:
      'Live-approved listings get a server-rendered page with your real app URL in the HTML — for evaluators and crawlers, not a paid placement game.',
  },
  {
    icon: ShieldCheck,
    title: 'Embed badge when live',
    description:
      'Live-approved apps get an SVG that says StackApps Verified and links to your proof page — separate from Bronze/Silver/Gold tiers on the listing.',
  },
  {
    icon: SearchCheck,
    title: '12-point readiness scan',
    description:
      'Twelve automated checks (crawl health, MCP, CLI, FAQ, blueprint, PWA, viewport). Tiers summarize how far you got; PWA has its own badge.',
  },
] as const;

const proofPoints = [
  'Open methodology (GitHub)',
  'Free 12-signal audit',
  'Curated proof — no pay-to-rank',
  'StackLaunch when you want fixes',
] as const;

export default function Home() {
  const { user, loading } = useCurrentUser();
  const [, setLocation] = useLocation();
  const [registryReady, setRegistryReady] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setLocation('/hub');
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (loading || user) return;
    setPageSeo(
      'StackApps — Open-source AI & crawl readiness audit (Lighthouse for the agent era)',
      'Free twelve-check technical audit: what search and AI systems can discover and operate. Every check is on GitHub. The Stackhouse is human-reviewed public proof when you list — not a generic AI directory.',
    );
  }, [loading, user]);

  useEffect(() => {
    if (loading || user) return;
    let cancelled = false;
    const run = () => {
      if (!cancelled) setRegistryReady(true);
    };
    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(run, { timeout: 1800 });
      return () => {
        cancelled = true;
        cancelIdleCallback(id);
      };
    }
    const t = window.setTimeout(run, 32);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [loading, user]);

  if (loading || user) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-cyber-black">
      <NavBar activePage="home" />

      <section className="relative overflow-hidden border-b border-cyber-light">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,243,255,0.18),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(188,19,254,0.18),transparent_30%),linear-gradient(180deg,rgba(18,18,18,0.7),#050505)]" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[95%] -translate-x-1/2 rounded-full bg-neon-blue/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 rounded-full bg-neon-green/10 blur-[90px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 md:pt-20 md:pb-24">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-neon-green/30 bg-neon-green/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-neon-green">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Lighthouse for the agent era
              </div>

              <h1 className="mt-6 max-w-[14rem] sm:max-w-xl md:max-w-2xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.06] [text-shadow:0_0_48px_rgba(0,243,255,0.22)]">
                <span className="block">We build to be found and cited.</span>
                <span className="block mt-1 sm:mt-1.5">You can too.</span>
              </h1>
              <p className="mt-5 md:mt-6 text-lg md:text-xl text-gray-400 max-w-xl leading-snug">
                Start with a <Link href="/scan" className="text-neon-blue hover:text-white transition-colors">free scan</Link>, then publish the signals agents actually read.
              </p>
              <p className="mt-3 text-sm text-gray-500 max-w-xl leading-relaxed">
                &quot;Found and cited&quot; means legible, stable facts — not traffic guarantees.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/scan"
                  className="inline-flex justify-center items-center px-7 py-3.5 bg-neon-green text-black font-extrabold rounded-sm uppercase tracking-wide shadow-[0_0_28px_rgba(57,255,20,0.35)] hover:shadow-[0_0_36px_rgba(57,255,20,0.5)] hover:bg-white transition-all"
                  data-testid="button-free-scan-hero"
                  data-agent-id="home-hero-scan"
                >
                  Scan your app for free
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex justify-center items-center px-7 py-3.5 border border-neon-blue/70 text-neon-blue font-bold rounded-sm uppercase tracking-wide hover:bg-neon-blue/10 hover:text-white transition-all"
                  data-testid="button-browse"
                  data-agent-id="home-browse-stackhouse"
                >
                  Browse The Stackhouse
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {proofPoints.map(point => (
                  <span key={point} className="rounded-full border border-cyber-light bg-cyber-black/60 px-3 py-1 text-xs font-semibold text-gray-300">
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-neon-blue/30 via-neon-purple/15 to-neon-green/25 blur-xl" />
              <div className="relative rounded-3xl border border-cyber-light bg-cyber-dark/90 p-5 md:p-6 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between border-b border-cyber-light pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-gray-500">When your listing is live</p>
                    <h2 className="mt-1 text-xl font-bold text-white">Proof surfaces on top of the audit</h2>
                  </div>
                  <div className="rounded-full border border-neon-blue/40 bg-neon-blue/10 p-3 text-neon-blue">
                    <Radar className="h-6 w-6" aria-hidden />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {builderPerks.map(({ icon: Icon, title, description }) => (
                    <div key={title} className="rounded-2xl border border-cyber-light bg-cyber-black/70 p-4">
                      <div className="flex gap-3">
                        <div className="mt-0.5 h-9 w-9 flex-shrink-0 rounded-lg border border-neon-green/30 bg-neon-green/10 text-neon-green flex items-center justify-center">
                          <Icon className="h-5 w-5" aria-hidden />
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{title}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-gray-400">{description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-neon-blue/30 bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 p-4">
                  <div className="flex items-center gap-2 text-neon-blue font-bold">
                    <Bot className="h-5 w-5" aria-hidden />
                    AI and search readiness
                  </div>
                  <p className="mt-2 text-sm text-gray-300">
                    Lead with the audit and open methodology; treat the registry as credibility, not the headline. Failed checks point to StackLaunch AIEO/GEO. A clean run points to market viability before you spend on promotion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cyber-dark/50 border-b border-cyber-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-14 items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-neon-blue">Why this is different</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Compliance, not another AI link directory.
              </h2>
              <p className="mt-4 text-gray-400 leading-relaxed">
                The market is full of low-signal directories and opaque GEO widgets. StackApps leads with a <span className="text-gray-200">public, forkable checklist</span> so founders and agencies can defend the score.
                The Stackhouse is a curated layer for apps that clear moderation — proof, not pay-to-list noise. See <Link href="/for-builders" className="text-neon-blue hover:text-white transition-colors">builder benefits</Link> or read the <Link href="/faq" className="text-neon-blue hover:text-white transition-colors">FAQ</Link> for tier details.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                ['01', 'Start free', 'Get your browser-ready app in the queue for human review.'],
                ['02', 'Go live', 'Live approval turns on public proof: canonical page, embed badge, and scan on your listing.'],
                ['03', 'Ask before you invest more', 'Once you clear the bar on the audit, find out if there\'s actually a market for it — before you spend another hour building.'],
              ].map(([n, title, body]) => (
                <div key={n} className="rounded-2xl border border-cyber-light bg-cyber-black/60 p-5 shadow-[0_0_0_1px_rgba(0,243,255,0.05)]">
                  <div className="text-xs font-bold text-neon-green">{n}</div>
                  <h3 className="mt-3 font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-400">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
        {registryReady ? (
          <Suspense fallback={<HomeRegistryTeaserSkeleton />}>
            <HomeRegistryTeaser />
          </Suspense>
        ) : (
          <HomeRegistryTeaserSkeleton />
        )}

        <section className="mt-20 md:mt-24 relative overflow-hidden rounded-3xl border border-cyber-light bg-cyber-dark p-8 md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(57,255,20,0.16),transparent_34%),linear-gradient(135deg,rgba(0,243,255,0.08),transparent)] pointer-events-none" />
          <div className="relative grid lg:grid-cols-[1fr_0.9fr] gap-8 items-center">
            <div>
              <div className="inline-flex rounded-full border border-neon-green/30 bg-neon-green/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-neon-green">
                Free proof before paid promotion
              </div>
              <h2 className="mt-4 text-2xl md:text-4xl font-extrabold text-white tracking-tight">Is there a market for your app? Find out before you invest more.</h2>
              <p className="mt-4 text-gray-400 text-base md:text-lg leading-relaxed">
                Clear the bar on the technical audit, then ask the question most builders skip until it is too late — is there actually a market for this, and what direction makes it more marketable?
              </p>
            </div>
            <div className="rounded-2xl border border-cyber-light bg-cyber-black/70 p-5">
              {['Backlink issued', 'Badge embed ready', 'Readiness score visible'].map((item) => (
                <div key={item} className="flex items-center gap-3 border-b border-cyber-light py-3 last:border-b-0">
                  <BadgeCheck className="h-5 w-5 text-neon-green" aria-hidden />
                  <span className="font-medium text-gray-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className="inline-flex justify-center items-center px-8 py-3 bg-neon-green text-black font-bold rounded-sm hover:bg-white transition-all shadow-[0_0_18px_rgba(57,255,20,0.35)] uppercase tracking-wide"
            >
              Submit Your App Free
            </Link>
            <Link
              href="/for-builders"
              className="inline-flex justify-center items-center px-8 py-3 border border-neon-blue/70 text-neon-blue font-bold rounded-sm hover:bg-neon-blue/10 hover:text-white transition-all uppercase tracking-wide"
              data-testid="link-for-builders"
            >
              See Builder Benefits
            </Link>
          </div>
        </section>

        <aside className="mt-12 md:mt-14 rounded-2xl border border-neon-yellow/30 bg-gradient-to-br from-cyber-dark to-cyber-black px-6 py-5 md:px-8 md:py-6 shadow-[0_0_24px_rgba(250,204,21,0.08)]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-shrink-0 inline-flex rounded-md border border-neon-yellow/40 bg-neon-yellow/10 p-2.5 text-neon-yellow">
              <Rocket className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed">
              <><span className="text-neon-yellow font-semibold">The question most builders skip:</span>{' '}Is there actually a market for this? StackApps runs the technical audit and verification layer — free. StackLaunch answers that question, and tells you what direction would make your app more marketable.</>
            </p>
          </div>
        </aside>

        <section className="mt-16 md:mt-20" aria-labelledby="home-faq-heading">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-neon-blue">FAQ</p>
          <h2 id="home-faq-heading" className="mt-3 text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Common questions
          </h2>
          <p className="mt-4 text-gray-400 leading-relaxed max-w-2xl">
            Quick answers for builders and evaluators. Full list on the <Link href="/faq" className="text-neon-blue hover:text-white transition-colors">FAQ page</Link> or in our <Link href="/guides" className="text-neon-blue hover:text-white transition-colors">scanner guides</Link>.
          </p>
          <div className="mt-8 space-y-4">
            {[
              {
                q: 'What is StackApps?',
                a: 'A free, open-source twelve-signal technical audit for AI and crawl readiness, plus optional public proof on The Stackhouse when you list and go live.',
              },
              {
                q: 'What does the scan check?',
                a: 'Twelve checks: crawl health (robots, sitemap, llms.txt), machine signals (FAQ, blueprint, MCP, CLI), and PWA basics. Run it free at /scan.',
              },
              {
                q: 'Is StackApps free?',
                a: 'Yes — browsing, scanning, and listing are free. Live-approved apps get proof pages, embed badges, and tier labels at no cost.',
              },
              {
                q: 'What are Bronze, Silver, and Gold?',
                a: 'Readiness tiers from the twelve checks. Bronze is baseline discoverability; Silver adds CLI, FAQ, and viewport; Gold adds MCP and blueprint.txt.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-2xl border border-cyber-light bg-cyber-black/60 p-5 md:p-6">
                <h3 className="text-lg font-bold text-white">{q}</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
