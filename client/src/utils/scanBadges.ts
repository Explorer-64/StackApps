import type { App } from '@shared/schema';

export type ReadinessTier = 'bronze' | 'silver' | 'gold';

export function meetsBaseline(app: App): boolean {
  return !!(app.scan_reachable && app.scan_robots && app.scan_sitemap && app.scan_llms);
}

export function meetsBronze(app: App): boolean {
  return meetsBaseline(app);
}

export function meetsSilver(app: App): boolean {
  return meetsBronze(app) && !!app.scan_cli && !!app.scan_faq && !!app.scan_viewport;
}

export function meetsGold(app: App): boolean {
  return meetsSilver(app) && !!app.scan_mcp && !!app.scan_blueprint;
}

/** Highest readiness tier met (requires a stored scan). */
export function getReadinessTier(app: App): ReadinessTier | null {
  if (!app.scan_timestamp) return null;
  if (meetsGold(app)) return 'gold';
  if (meetsSilver(app)) return 'silver';
  if (meetsBronze(app)) return 'bronze';
  return null;
}

export function readinessTierLabel(tier: ReadinessTier): { name: string; tagline: string } {
  switch (tier) {
    case 'gold':
      return { name: 'Gold', tagline: 'Agent-native' };
    case 'silver':
      return { name: 'Silver', tagline: 'Automatable' };
    case 'bronze':
      return { name: 'Bronze', tagline: 'Discoverable' };
  }
}

export function readinessTierBadgeClassName(tier: ReadinessTier): string {
  switch (tier) {
    case 'bronze':
      return 'border-2 border-orange-500 bg-[#3b1f0f] text-orange-100 shadow-sm';
    case 'silver':
      return 'border-2 border-cyan-400/80 bg-slate-700 text-white shadow-sm';
    case 'gold':
      return 'border-2 border-amber-200 bg-gradient-to-br from-amber-400 to-yellow-400 text-gray-900 shadow-[0_0_14px_rgba(251,191,36,0.45)] font-extrabold';
  }
}

/** @deprecated Prefer getReadinessTier — kept for callers that mean “met Gold bar.” */
export function isVerified(app: App): boolean {
  return meetsGold(app);
}

export type PwaBadgeState = 'green' | 'amber' | null;

export function getPwaBadge(app: App): PwaBadgeState {
  if (!app.scan_pwa_android) return null;
  return app.scan_pwa_ios && app.scan_pwa_sw ? 'green' : 'amber';
}

export function hasBlueprint(app: App): boolean {
  return app.scan_blueprint === true;
}
