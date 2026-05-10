import { useAppStore } from '@/lib/appStore';
import { AppCard } from '@/components/AppCard';
import { Link } from 'wouter';
import { useEffect } from 'react';
import { setPageSeo } from '@/utils/seo';
import { useCurrentUser } from '@/hooks/use-current-user';
import { SiteFooter } from '@/components/SiteFooter';
import { Construction, ArrowLeft, HardHat } from 'lucide-react';

export default function UnderConstruction() {
  const { user } = useCurrentUser();
  const { publicApps, isLoading, error, subscribeToPublicApps } = useAppStore();

  const buildingApps = publicApps.filter(app => app.status === 'building');

  useEffect(() => {
    const unsubscribe = subscribeToPublicApps();
    return () => unsubscribe();
  }, [subscribeToPublicApps]);

  useEffect(() => {
    setPageSeo(
      'Under construction apps — StackApps',
      'Browse StackApps listings marked as in development—MVPs and upcoming PWA SaaS before they ship.',
    );
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-cyber-black">
      <header className="bg-cyber-black/80 backdrop-blur-md border-b border-cyber-light sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Construction className="w-8 h-8 text-neon-yellow" />
              <h1 className="text-3xl font-bold text-white" data-testid="text-page-title">
                Under Construction
              </h1>
            </div>
            <Link 
              href="/" 
              className="flex items-center gap-2 text-gray-400 hover:text-neon-blue transition-colors"
              data-testid="link-back-gallery"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Gallery</span>
            </Link>
          </div>
          <p className="text-gray-400 mt-2 max-w-3xl">
            Sneak peek at the next generation of apps currently being built by our community.
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neon-yellow"></div>
            <p className="mt-4 text-gray-400">Loading works in progress...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {!isLoading && !error && buildingApps.length === 0 && (
          <div className="text-center py-16 bg-cyber-gray rounded-lg border border-cyber-light">
            <HardHat className="w-16 h-16 text-neon-yellow mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white" data-testid="text-empty-state">No apps under construction</h3>
            <p className="mt-2 text-gray-400">All our apps are currently live! Check back soon for new projects.</p>
            <Link 
              href="/" 
              className="mt-4 inline-block text-neon-blue hover:text-white font-medium transition-colors"
              data-testid="link-browse-live"
            >
              Browse Live Apps
            </Link>
          </div>
        )}

        {!isLoading && !error && buildingApps.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {buildingApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </main>
      
      <SiteFooter />
    </div>
  );
}
