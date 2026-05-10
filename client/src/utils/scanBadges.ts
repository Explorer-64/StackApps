import type { App } from '@shared/schema';

export function isVerified(app: App): boolean {
  return !!(
    app.scan_reachable &&
    app.scan_robots &&
    app.scan_sitemap &&
    app.scan_llms &&
    app.scan_faq &&
    app.scan_viewport &&
    app.scan_mcp &&
    app.scan_cli
  );
}

export type PwaBadgeState = 'green' | 'amber' | null;

export function getPwaBadge(app: App): PwaBadgeState {
  if (!app.scan_pwa_android) return null;
  return app.scan_pwa_ios && app.scan_pwa_sw ? 'green' : 'amber';
}

export function hasBlueprint(app: App): boolean {
  return app.scan_blueprint === true;
}

export function meetsBaseline(app: App): boolean {
  return !!(app.scan_reachable && app.scan_robots && app.scan_sitemap && app.scan_llms);
}

