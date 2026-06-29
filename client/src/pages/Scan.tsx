import { useState, useCallback, useEffect } from 'react';
import { Link } from 'wouter';
import { Lock } from 'lucide-react';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { useCurrentUser } from '@/hooks/use-current-user';
import { setPageSeo } from '@/utils/seo';
import { READINESS_CHECKS } from '@/components/ReadinessScan';
import { ReadinessCheckHint } from '@/components/ReadinessCheckHint';
import { meetsBaseline } from '@/utils/scanBadges';
import type { App } from '@shared/schema';

type PublicScanResponse = {
  already_scanned: boolean;
  domain: string;
  url: string;
  scan_score: number;
  scan_results: Record<string, boolean | number | undefined>;
  scan_timestamp: string;
  converted?: boolean;
  converted_at?: string | null;
  app_id?: string | null;
  error?: string;
};

const SCAN_SESSION_KEY = 'stackapps_public_scan_session';

type ScanSessionPayload = { urlInput: string; response: PublicScanResponse };

function readScanSession(): ScanSessionPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SCAN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const { urlInput, response } = parsed as ScanSessionPayload;
    if (typeof urlInput !== 'string' || !response || typeof response !== 'object') return null;
    if (typeof (response as PublicScanResponse).scan_score !== 'number') return null;
    return { urlInput, response: response as PublicScanResponse };
  } catch {
    return null;
  }
}

function writeScanSession(payload: ScanSessionPayload) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SCAN_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota or private mode */
  }
}

function publicScanEndpoint(): string | null {
  const custom = import.meta.env.VITE_PUBLIC_SCAN_URL as string | undefined;
  if (custom) return custom.replace(/\/$/, '');
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId || projectId.startsWith('$')) return null;
  return `https://us-central1-${projectId}.cloudfunctions.net/publicScan`;
}

function ScanCheckGrid({ results }: { results: Record<string, boolean | number | undefined> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {READINESS_CHECKS.map((check) => {
        const passed = results[check.field] === true;
        return (
          <div
            key={check.field}
            className="bg-cyber-black border border-cyber-light rounded-lg px-4 py-3 flex items-center justify-between gap-3"
          >
            <div className="flex min-w-0 items-center gap-2">
              <ReadinessCheckHint
                whatItIs={check.whatItIs}
                whyWeCheck={check.whyWeCheck}
                guideHref={check.guideHref}
              />
              <span className="text-gray-300 font-medium">{check.label}</span>
              {check.pwa && (
                <span className="bg-neon-blue/10 text-neon-blue border border-neon-blue/30 rounded-sm px-1.5 py-0.5 text-[10px] font-bold shrink-0">
                  PWA
                </span>
              )}
            </div>
            <span className={`font-bold text-lg ${passed ? 'text-neon-green' : 'text-red-500'}`}>
              {passed ? '✓' : '✗'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Scan() {
  const { user, loading: authLoading } = useCurrentUser();
  const [urlInput, setUrlInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<PublicScanResponse | null>(null);

  useEffect(() => {
    setPageSeo(
      'Free AI & crawl readiness scan — StackApps',
      'Open-source twelve-signal audit on your live URL. One free scan per domain. Sign in to see every check. Not a directory signup — technical compliance first.',
    );
  }, []);

  useEffect(() => {
    if (!user || response) return;
    const stored = readScanSession();
    if (!stored) return;
    setUrlInput(stored.urlInput);
    setResponse(stored.response);
  }, [user, response]);

  const runScan = useCallback(async () => {
    setError(null);
    const url = urlInput.trim();
    if (!url.startsWith('http')) {
      setError('Enter a full URL starting with https://');
      return;
    }
    setBusy(true);
    try {
      const endpoint = publicScanEndpoint();
      if (!endpoint) {
        setError('Scan service URL is not configured.');
        setBusy(false);
        return;
      }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as PublicScanResponse & { error?: string };
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Scan failed.');
        setResponse(null);
        return;
      }
      setResponse(data);
      writeScanSession({ urlInput: url, response: data });
    } catch {
      setError('Could not reach the scan service. Try again.');
      setResponse(null);
    } finally {
      setBusy(false);
    }
  }, [urlInput]);

  const score = response?.scan_score ?? 0;
  const results = (response?.scan_results ?? {}) as Record<string, boolean | number | undefined>;
  const resultsAsApp = results as unknown as App;
  const clearedBaseline = meetsBaseline(resultsAsApp);
  const anonymousRepeat = Boolean(response?.already_scanned && !user);
  const showBlurredGrid = Boolean(response && !user && !response.already_scanned);

  return (
    <div className="min-h-screen flex flex-col bg-cyber-black">
      <NavBar activePage="scan" />

      <main className="flex-grow w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Can crawlers and agents actually use your site?
        </h1>
        <p className="mt-3 text-gray-400 text-lg">
          Same twelve checks we ship in <a href="https://github.com/Explorer-64/StackApps" className="text-neon-blue hover:underline">open source</a> — free, no sign-in to start. One scan per domain. Not sure what we measure? Read the <Link href="/guides" className="text-neon-blue hover:underline font-medium">guides</Link> first.
        </p>
        <p className="mt-3 text-sm text-gray-500">
          <Link href="/guides" className="text-neon-blue hover:underline font-medium">
            Guides
          </Link>
          <span className="text-gray-600"> · </span>
          <Link href="/guides/llms-txt" className="text-gray-400 hover:text-neon-blue transition-colors">
            llms.txt
          </Link>
          <span className="text-gray-600"> · </span>
          <Link href="/guides/faq" className="text-gray-400 hover:text-neon-blue transition-colors">
            /faq
          </Link>
          <span className="text-gray-600"> · </span>
          <Link href="/guides/cli-silver" className="text-gray-400 hover:text-neon-blue transition-colors">
            CLI &amp; Silver
          </Link>
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://yourapp.com"
            className="flex-1 rounded-sm border border-cyber-light bg-cyber-dark px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
            data-agent-id="public-scan-input"
            disabled={busy}
          />
          <button
            type="button"
            onClick={() => void runScan()}
            disabled={busy || authLoading}
            className="px-6 py-3 bg-neon-green text-black font-extrabold rounded-sm uppercase tracking-wide hover:bg-white transition-colors disabled:opacity-50"
            data-agent-id="public-scan-submit"
          >
            {busy ? 'Scanning…' : 'Run scan'}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">No card needed.</p>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {response && (
          <div className="mt-10 space-y-6">
            <p className="text-xl font-bold text-white">
              Your app scored {score}/12
            </p>

            {user ? (
              <>
                <ScanCheckGrid results={results} />
                {clearedBaseline ? (
                  <div className="mt-8 rounded-xl border border-neon-green/45 bg-neon-green/10 p-6 sm:p-8">
                    <h3 className="text-lg font-bold text-white">You cleared the crawl bar</h3>
                    <p className="mt-3 text-gray-300 text-sm leading-relaxed">
                      That is the same baseline we use before an app can stay live on The Stackhouse. List free for human review: live approval unlocks a canonical proof page (your URL in the HTML for crawlers), an embeddable badge (StackApps Verified on the SVG when live), and Bronze/Silver/Gold tiers from all twelve checks on your listing.
                    </p>
                    <Link
                      href="/hub"
                      className="mt-5 inline-flex justify-center items-center px-7 py-3.5 bg-neon-green text-black font-extrabold rounded-sm uppercase tracking-wide shadow-[0_0_24px_rgba(57,255,20,0.25)] hover:bg-white transition-all"
                      data-agent-id="scan-cta-submit-app"
                    >
                      Submit your app free
                    </Link>
                    <p className="mt-4 text-sm text-gray-300 leading-relaxed">
                      Tighten anything in the checklist above, then run a fresh audit from{' '}
                      <span className="text-orange-400 font-semibold">My Apps</span> with{' '}
                      <span className="text-orange-400 font-semibold">Re-run scan</span> — available once every 24 hours per listed app while you ship.
                    </p>
                  </div>
                ) : (
                  <div className="mt-8 rounded-xl border border-neon-blue/35 bg-cyber-dark/90 p-6 sm:p-8">
                    <h3 className="text-lg font-bold text-white">Still wiring things up?</h3>
                    <p className="mt-3 text-gray-300 text-sm leading-relaxed">
                      You do not need a perfect score to join. Submit as a <span className="text-neon-blue font-semibold">work in progress</span> — we often approve apps as &quot;building&quot; so you can live in the queue, finish the gaps above, then request live review when you are ready for the backlink, badge, and full audit on your listing.
                    </p>
                    <Link
                      href="/hub"
                      className="mt-5 inline-flex justify-center items-center px-7 py-3.5 border-2 border-neon-blue text-neon-blue font-bold rounded-sm uppercase tracking-wide hover:bg-neon-blue/10 hover:text-white transition-all"
                      data-agent-id="scan-cta-building"
                    >
                      Submit as work in progress
                    </Link>
                    <p className="mt-4 text-sm text-gray-300 leading-relaxed">
                      After you list, ship fixes and use <span className="text-orange-400 font-semibold">Re-run scan</span> on{' '}
                      <span className="text-orange-400 font-semibold">My Apps</span> to refresh this audit — once every 24 hours per app.
                    </p>
                  </div>
                )}
              </>
            ) : anonymousRepeat ? (
              <div className="rounded-xl border border-cyber-light bg-cyber-dark/80 p-6 text-gray-300">
                <p className="font-medium text-white">
                  You&apos;ve already scanned {response.domain}.
                </p>
                <p className="mt-3 text-sm leading-relaxed">
                  Sign in free to see what&apos;s failing — no card, no commitment.
                </p>
                <Link
                  href="/login?next=%2Fscan"
                  className="mt-4 inline-flex text-neon-blue font-semibold hover:text-neon-green transition-colors"
                >
                  Sign in to see results →
                </Link>
              </div>
            ) : showBlurredGrid ? (
              <div className="relative rounded-xl border border-cyber-light overflow-hidden">
                <div className="p-4 filter blur-[4px] pointer-events-none select-none opacity-70">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {READINESS_CHECKS.map((check) => (
                      <div
                        key={check.field}
                        className="bg-cyber-black border border-cyber-light rounded-lg px-4 py-3 flex items-center justify-between gap-3"
                      >
                        <span className="text-gray-300 font-medium">{check.label}</span>
                        <span className="text-gray-500 font-bold">—</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 px-6 text-center">
                  <Lock className="h-10 w-10 text-neon-yellow" aria-hidden />
                  <p className="text-sm text-gray-200 max-w-md leading-relaxed">
                    Sign in free to see exactly what&apos;s failing and how to fix it — no card, no commitment.
                  </p>
                  <Link
                    href="/login?next=%2Fscan"
                    className="inline-flex text-neon-blue font-semibold hover:text-neon-green transition-colors"
                  >
                    Sign in to see results →
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
