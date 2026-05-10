import { useState, useCallback, useEffect } from 'react';
import { Link } from 'wouter';
import { Lock } from 'lucide-react';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { useCurrentUser } from '@/hooks/use-current-user';
import { setPageSeo } from '@/utils/seo';
import { READINESS_CHECKS } from '@/components/ReadinessScan';

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
            <div className="flex items-center gap-2">
              <span className="text-gray-300 font-medium">{check.label}</span>
              {check.pwa && (
                <span className="bg-neon-blue/10 text-neon-blue border border-neon-blue/30 rounded-sm px-1.5 py-0.5 text-[10px] font-bold">
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
      'Free AI readiness scan — StackApps',
      'Run a free technical audit on your live URL. One scan per domain. Sign in to see every check and fixes.',
    );
  }, []);

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
    } catch {
      setError('Could not reach the scan service. Try again.');
      setResponse(null);
    } finally {
      setBusy(false);
    }
  }, [urlInput]);

  const score = response?.scan_score ?? 0;
  const results = (response?.scan_results ?? {}) as Record<string, boolean | number | undefined>;
  const anonymousRepeat = Boolean(response?.already_scanned && !user);
  const showBlurredGrid = Boolean(response && !user && !response.already_scanned);

  return (
    <div className="min-h-screen flex flex-col bg-cyber-black">
      <NavBar activePage="scan" />

      <main className="flex-grow w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          How AI-ready is your app?
        </h1>
        <p className="mt-3 text-gray-400 text-lg">
          Free scan. No sign-in required. One scan per domain.
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
                <p className="text-gray-300 text-sm leading-relaxed pt-2">
                  Fixed the gaps? Get your results publicly verified on The Stackhouse — free.
                </p>
                <Link
                  href="/hub"
                  className="inline-flex text-neon-blue font-semibold hover:text-neon-green transition-colors"
                >
                  Get verified free →
                </Link>
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
                  href="/login"
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
                    href="/login"
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
