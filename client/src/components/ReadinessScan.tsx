import type { App } from '@shared/schema';
import { getPwaBadge, hasBlueprint, isVerified } from '@/utils/scanBadges';

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

export const READINESS_CHECKS: Array<{ label: string; field: ReadinessCheckKey; pwa?: boolean }> = [
  { label: 'Site reachable', field: 'scan_reachable' },
  { label: 'llms.txt', field: 'scan_llms' },
  { label: 'robots.txt', field: 'scan_robots' },
  { label: 'sitemap.xml', field: 'scan_sitemap' },
  { label: 'FAQ presence', field: 'scan_faq' },
  { label: 'MCP endpoint', field: 'scan_mcp' },
  { label: 'CLI available', field: 'scan_cli' },
  { label: 'Android PWA', field: 'scan_pwa_android', pwa: true },
  { label: 'iOS PWA', field: 'scan_pwa_ios', pwa: true },
  { label: 'Service Worker', field: 'scan_pwa_sw', pwa: true },
  { label: 'Viewport meta', field: 'scan_viewport' },
  { label: 'Blueprint Protocol', field: 'scan_blueprint' },
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
  const hasScan = Boolean(app.scan_timestamp);
  const showChecks = isOwner || app.scan_public === true;

  const verified = hasScan && isVerified(app);
  const pwaBadge = hasScan ? getPwaBadge(app) : null;
  const blueprint = hasScan && hasBlueprint(app);

  return (
    <section
      className="bg-cyber-gray rounded-xl shadow-lg border border-cyber-light p-6 md:p-8 mb-8"
      data-agent-id="readiness-scan-section"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Site Readiness</h2>
          {hasScan && (
            <p className="text-gray-500 text-xs mt-1">Last checked: {formatDate(app.scan_timestamp!)}</p>
          )}

          {hasScan && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {verified && (
                <span
                  className="inline-flex items-center rounded-sm px-2 py-1 text-xs font-bold text-white"
                  style={{ backgroundColor: '#15803d' }}
                  data-agent-id="scan-badge-verified"
                >
                  StackApps Verified ✓
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
          {READINESS_CHECKS.map(check => {
            const passed = app[check.field] === true;

            return (
              <div key={check.field} className="bg-cyber-black border border-cyber-light rounded-lg px-4 py-3 flex items-center justify-between gap-3">
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
      ) : hasScan ? null : (
        <div className="bg-cyber-black border border-dashed border-cyber-light rounded-lg p-5 mb-6 text-gray-500">
          Scan pending — results will appear after live approval.
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
