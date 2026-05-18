import type { App } from '@shared/schema';
import {
  getPwaBadge,
  getReadinessTier,
  hasBlueprint,
  readinessTierBadgeClassName,
  readinessTierLabel,
} from '@/utils/scanBadges';
import { READINESS_LAB_CHECKS } from '@/utils/readinessLabs';
import { ReadinessCheckHint } from '@/components/ReadinessCheckHint';
import { useCurrentUser } from '@/hooks/use-current-user';
import { isAdmin } from '@/lib/admins';

export type ReadinessCheckKey =
  | 'scan_reachable'
  | 'scan_llms'
  | 'scan_robots'
  | 'scan_sitemap'
  | 'scan_faq'
  | 'scan_pwa_android'
  | 'scan_pwa_ios'
  | 'scan_pwa_sw'
  | 'scan_viewport'
  | 'scan_blueprint'
  | 'scan_mcp'
  | 'scan_cli';

export type ReadinessCheckRow = {
  label: string;
  field: ReadinessCheckKey;
  pwa?: boolean;
  whatItIs: string;
  whyWeCheck: string;
  guideHref?: string;
};

export const READINESS_CHECKS: ReadinessCheckRow[] = [
  {
    label: 'Site reachable',
    field: 'scan_reachable',
    whatItIs: 'Your public URL returns a normal web page when we request it.',
    whyWeCheck: 'If the app is unreachable or errors, other signals are unreliable and users cannot rely on the listing.',
  },
  {
    label: 'llms.txt',
    field: 'scan_llms',
    guideHref: '/guides/llms-txt',
    whatItIs: 'A small text file at /llms.txt that summarizes what your product is for language models and tools.',
    whyWeCheck: 'It gives crawlers and assistants a factual hook instead of guessing from marketing copy alone.',
  },
  {
    label: 'robots.txt',
    field: 'scan_robots',
    whatItIs: 'The standard file at /robots.txt that tells crawlers what they may fetch on your site.',
    whyWeCheck: 'It is a basic hygiene signal that you expect bots and care about how your site is crawled.',
  },
  {
    label: 'sitemap.xml',
    field: 'scan_sitemap',
    whatItIs: 'A machine-readable list of important URLs, usually at /sitemap.xml.',
    whyWeCheck: 'Helps search engines and tools discover your pages in a structured way.',
  },
  {
    label: 'FAQ presence',
    field: 'scan_faq',
    guideHref: '/guides/faq',
    whatItIs: 'We look for a dedicated FAQ page at /faq (HTTP 200).',
    whyWeCheck: 'Central answers reduce support noise and give models a stable place to summarize common questions.',
  },
  {
    label: 'MCP endpoint',
    field: 'scan_mcp',
    whatItIs: 'Signals that your app exposes or documents a Model Context Protocol surface (HTML tags, or install hints in llms.txt / blueprint.txt).',
    whyWeCheck: 'MCP helps agent runtimes connect to your product as tools instead of scraping the UI.',
  },
  {
    label: 'CLI available',
    field: 'scan_cli',
    guideHref: '/guides/cli-silver',
    whatItIs: 'We detect common install patterns like npx, npm -g, brew install, pipx, uvx, etc. in your page or docs files.',
    whyWeCheck: 'A CLI path is easy for developers and scripts to automate without clicking through the product.',
  },
  {
    label: 'Android PWA',
    field: 'scan_pwa_android',
    pwa: true,
    whatItIs: 'A web app manifest and icons that meet installability-style checks for Android/Chrome.',
    whyWeCheck: 'Shows the product can be installed like an app from the browser — great for mobile users.',
  },
  {
    label: 'iOS PWA',
    field: 'scan_pwa_ios',
    pwa: true,
    whatItIs: 'Apple-specific meta tags that improve add-to-home-screen behavior.',
    whyWeCheck: 'Improves the experience when someone saves your web app to their iPhone or iPad home screen.',
  },
  {
    label: 'Service Worker',
    field: 'scan_pwa_sw',
    pwa: true,
    whatItIs: 'A service worker script (often sw.js) that can cache assets and support offline or faster loads.',
    whyWeCheck: 'Common piece of a progressive web app; indicates you went beyond a plain static page.',
  },
  {
    label: 'Viewport meta',
    field: 'scan_viewport',
    whatItIs: 'The viewport meta tag that tells mobile browsers how to scale your layout.',
    whyWeCheck: 'Without it, pages often look tiny or broken on phones — a basic quality bar for web SaaS.',
  },
  {
    label: 'Blueprint Protocol',
    field: 'scan_blueprint',
    whatItIs: 'A blueprint.txt file that maps capabilities and boundaries for agents (StackApps / Blueprint Protocol convention).',
    whyWeCheck: 'Structured guidance reduces wrong automation and documents what is supported on your site.',
  },
];

function formatDate(timestamp: string) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export type RescanState = 'idle' | 'running' | 'done' | 'cooldown' | 'failed';

interface Props {
  app: App;
  isOwner: boolean;
  rescanState?: RescanState;
  onRescan?: () => void;
}

export function ReadinessScan({ app, isOwner, rescanState = 'idle', onRescan }: Props) {
  const { user } = useCurrentUser();
  const showAdminLabs = Boolean(user && isAdmin(user));
  const hasScan = Boolean(app.scan_timestamp);
  const showChecks = isOwner || app.scan_public === true;

  const tier = hasScan ? getReadinessTier(app) : null;
  const pwaBadge = hasScan ? getPwaBadge(app) : null;
  const blueprint = hasScan && hasBlueprint(app) && tier !== 'gold';

  return (
    <section
      className="bg-cyber-gray rounded-xl shadow-lg border border-cyber-light p-6 md:p-8 mb-8"
      data-agent-id="readiness-scan-section"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Site Readiness</h2>
          {hasScan && (isOwner || app.scan_public === true) && (
            <p className="text-gray-500 text-xs mt-1">Last checked: {formatDate(app.scan_timestamp!)}</p>
          )}

          {hasScan && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {tier && (
                <span
                  className={`inline-flex items-center rounded-sm border px-2 py-1 text-xs font-bold ${readinessTierBadgeClassName(tier)}`}
                  data-agent-id={`scan-badge-tier-${tier}`}
                >
                  {readinessTierLabel(tier).name} · {readinessTierLabel(tier).tagline}
                </span>
              )}

              {pwaBadge && (
                <span
                  className="inline-flex items-center rounded-sm px-2 py-1 text-xs font-bold text-white"
                  style={{ backgroundColor: pwaBadge === 'green' ? '#15803d' : '#b45309' }}
                  data-agent-id="scan-badge-pwa"
                >
                  {pwaBadge === 'green' ? 'PWA Ready' : 'PWA Partial'}
                </span>
              )}

              {blueprint && (
                <span
                  className="inline-flex items-center rounded-sm px-2 py-1 text-xs font-bold text-white"
                  style={{ backgroundColor: '#1d4ed8' }}
                  data-agent-id="scan-badge-blueprint"
                >
                  Blueprint
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {hasScan && showChecks ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {READINESS_CHECKS.map((check) => {
            const passed = app[check.field] === true;

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
                <span className={`font-bold text-lg shrink-0 ${passed ? 'text-neon-green' : 'text-red-500'}`}>
                  {passed ? '✓' : '✗'}
                </span>
              </div>
            );
          })}
        </div>
      ) : hasScan ? null : (
        <div className="bg-cyber-black border border-dashed border-cyber-light rounded-lg p-5 mb-6 text-gray-500">
          Scan pending — results will appear after live approval.
        </div>
      )}

      {showAdminLabs && (
        <div className="mb-6 rounded-lg border-2 border-dashed border-neon-purple/70 bg-cyber-black/80 p-4">
          <h3 className="text-sm font-bold text-neon-purple mb-1">Labs (admin only)</h3>
          <p className="text-xs text-gray-500 mb-3">
            Emerging signals — not used for Bronze/Silver/Gold or public marketing until promoted.
          </p>
          {!hasScan ? (
            <p className="text-xs text-amber-200/90 bg-amber-950/40 border border-amber-700/50 rounded px-2 py-2 mb-3">
              No scan on this listing yet — labs populate after live approval or a rescan.
            </p>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {READINESS_LAB_CHECKS.map((lab) => {
              const passed = app[lab.field] === true;
              return (
                <div
                  key={lab.field}
                  className="flex items-start justify-between gap-2 rounded border border-cyber-light/50 bg-cyber-gray/40 px-3 py-2 text-xs"
                >
                  <div>
                    <div className="font-medium text-gray-200">{lab.label}</div>
                    <div className="text-gray-500 mt-0.5">{lab.note}</div>
                  </div>
                  <span className={`font-bold shrink-0 ${passed ? 'text-neon-green' : 'text-gray-600'}`}>
                    {passed ? '✓' : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasScan && isOwner && (
        <p className="text-xs text-gray-500 mb-2">Score: {app.scan_score ?? 0}/12 (private)</p>
      )}

      {isOwner && onRescan && (
        <button
          onClick={onRescan}
          disabled={rescanState === 'running'}
          className="mt-4 px-4 py-2 border border-neon-purple text-neon-purple text-sm font-bold rounded-sm hover:bg-neon-purple hover:text-black transition-colors disabled:opacity-50"
          data-agent-id="readiness-rescan-button"
        >
          {rescanState === 'running'
            ? 'Running...'
            : rescanState === 'done'
              ? 'Done!'
              : rescanState === 'cooldown'
                ? 'Scan on cooldown'
                : rescanState === 'failed'
                  ? 'Failed'
                  : 'Re-run scan'}
        </button>
      )}
    </section>
  );
}
