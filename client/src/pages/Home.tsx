import { useAppStore } from '@/lib/appStore';
import { AppCard } from '@/components/AppCard';
import { Link, useLocation } from 'wouter';
import { useEffect } from 'react';
import { setPageSeo } from '@/utils/seo';
import { useCurrentUser } from '@/hooks/use-current-user';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { LoadingScreen } from '@/components/LoadingScreen';
import { BadgeCheck, Bot, Link2, Radar, Rocket, SearchCheck, ShieldCheck, Sparkles } from 'lucide-react';

const builderPerks = [
  {
    icon: Link2,
    title: 'Crawler-visible backlink',
    description:
      'Live-approved apps get a server-rendered page with a raw HTML link to the app URL.',
  },
  {
    icon: ShieldCheck,
    title: 'StackApps Verified badge',
    description:
      'Owners can display a StackApps badge that links back to the public proof page.',
  },
  {
    icon: SearchCheck,
    title: '12-point readiness scan',
    description:
      'Technical audit of search, AI crawler, PWA, and Blueprint Protocol signals before promotion.',
  },
] as const;

const proofPoints = [
  'Free technical audit',
  'Human vetted',
  'No pay-to-rank',
  'StackLaunch next step',
] as const;

export default function Home() {
  const { user, loading } = useCurrentUser();
  const { publicApps, isLoading, error, subscribeToPublicApps } = useAppStore();
  const [, setLocation] = useLocation();

  const featuredApps = publicApps.filter(app => app.isFeatured);
  const liveAppsCount = publicApps.filter(app => app.status === 'live').length;

  useEffect(() => {
    if (!loading && user) {
      setLocation('/hub');
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (loading || user) return;
    setPageSeo(
      'StackApps — Vetted registry & verification layer for AI-ready apps',
      'Free technical audit for indie builders: see what search and AI crawlers can find, read, and use before you spend on promotion. Open source scan logic.',
    );
  }, [loading, user]);

  useEffect(() => {
    const unsubscribe = subscribeToPublicApps();
    return () => unsubscribe();
  }, [subscribeToPublicApps]);

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
                Free verification layer
              </div>

              <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.04] [text-shadow:0_0_48px_rgba(0,243,255,0.22)]">
                Where apps prove they&apos;re actually built for the AI era.
              </h1>
              <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-2xl leading-relaxed">
                The free StackApps technical audit shows what search and AI crawlers can find, read, and operate — proof you cleared the bar, not just a claim.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/login"
                  className="inline-flex justify-center items-center px-7 py-3.5 bg-neon-green text-black font-extrabold rounded-sm uppercase tracking-wide shadow-[0_0_28px_rgba(57,255,20,0.35)] hover:shadow-[0_0_36px_rgba(57,255,20,0.5)] hover:bg-white transition-all"
                  data-testid="button-submit-app"
                >
                  List Your App Free
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
                    <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Live-approved package</p>
                    <h2 className="mt-1 text-xl font-bold text-white">Built for builders who ship</h2>
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
                    The scan is the story; your Stackhouse page is the proof. Failed checks point to StackLaunch AIEO/GEO. A clean audit points to Market Viability before you spend on promotion.
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
                Not another launch list. A verification layer.
              </h2>
              <p className="mt-4 text-gray-400 leading-relaxed">
                People do not need another noisy leaderboard. Builders need visible trust, crawler-friendly pages, and a practical path from verified to ready to promote.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                ['01', 'Start free', 'Get your browser-ready app in the queue for human review.'],
                ['02', 'Go live', 'Live approval activates the backlink, badge, and technical audit.'],
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
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-8 w-1 rounded-sm bg-neon-purple shadow-[0_0_12px_rgba(168,85,247,0.5)]" aria-hidden />
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-neon-purple">The Stackhouse</p>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">The public proof layer</h2>
            <p className="mt-2 text-gray-400">Browse verified apps on the vetted registry, see what is live, and follow the proof back to each maker.</p>
          </div>
          <div className="rounded-2xl border border-cyber-light bg-cyber-dark px-4 py-3 text-sm text-gray-300">
            <span className="font-bold text-neon-green">{liveAppsCount}</span> live-approved apps
            <span className="mx-2 text-cyber-light">/</span>
            <span className="font-bold text-neon-blue">{publicApps.length}</span> approved in registry
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-cyber-light border-t-neon-blue animate-spin" />
            <p className="text-sm text-gray-500">Loading featured picks…</p>
          </div>
        )}

        {!isLoading && error && (
          <p className="text-center text-sm text-gray-500 py-12">Featured apps unavailable right now.</p>
        )}

        {!isLoading && !error && featuredApps.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-10">Featured picks are on the way.</p>
        )}

        {!isLoading && !error && featuredApps.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="mt-12 text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-neon-blue font-semibold hover:text-neon-green transition-colors"
              data-testid="button-explore"
              data-agent-id="home-browse-more"
            >
              Browse the full Stackhouse
              <span aria-hidden>→</span>
            </Link>
          </div>
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
      </main>

      <SiteFooter />
    </div>
  );
}
