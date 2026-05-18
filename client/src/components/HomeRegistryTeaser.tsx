import { useEffect } from 'react';
import { Link } from 'wouter';
import { useAppStore } from '@/lib/appStore';
import { AppCard } from '@/components/AppCard';

export default function HomeRegistryTeaser() {
  const { publicApps, isLoading, error, subscribeToPublicApps } = useAppStore();

  const featuredApps = publicApps.filter(app => app.isFeatured);
  const liveAppsCount = publicApps.filter(app => app.status === 'live').length;

  useEffect(() => {
    const unsubscribe = subscribeToPublicApps();
    return () => unsubscribe();
  }, [subscribeToPublicApps]);

  return (
    <>
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
    </>
  );
}
