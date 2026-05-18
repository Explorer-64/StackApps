import { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { setPageSeo } from '@/utils/seo';
import { useAppStore } from '@/lib/appStore';
import { AppCard } from '@/components/AppCard';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Dashboard() {
  const {
    publicApps,
    subscribeToPublicApps,
    isLoading: appsLoading,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'rating'>('newest');

  useEffect(() => {
    const unsubscribe = subscribeToPublicApps();
    return () => unsubscribe();
  }, [subscribeToPublicApps]);

  useEffect(() => {
    setPageSeo(
      'The Stackhouse — vetted registry with public proof',
      'Browser-ready indie apps on StackApps: open twelve-signal readiness audits, tier labels, live embed badges, and canonical proof pages.',
    );
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(publicApps.map(app => app.category).filter(Boolean) as string[]);
    return ['All', ...Array.from(cats).sort()];
  }, [publicApps]);

  const filteredPublicApps = useMemo(() => {
    return publicApps
      .filter(app => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
          app.name.toLowerCase().includes(query) ||
          app.description.toLowerCase().includes(query) ||
          (app.tags && app.tags.some(tag => tag.toLowerCase().includes(query)))
        );
        const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        const buildingRank = (s?: string) => (s === 'building' ? 1 : 0);
        const buildingDiff = buildingRank(a.status) - buildingRank(b.status);
        if (buildingDiff !== 0) return buildingDiff;

        const featuredDiff =
          (b.isFeatured === true ? 1 : 0) - (a.isFeatured === true ? 1 : 0);
        if (featuredDiff !== 0) return featuredDiff;

        if (sortBy === 'rating') {
          const ratingDiff = (b.averageRating || 0) - (a.averageRating || 0);
          if (ratingDiff !== 0) return ratingDiff;
          return (b.ratingCount || 0) - (a.ratingCount || 0);
        }
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [publicApps, searchQuery, selectedCategory, sortBy]);

  const liveAppsCount = useMemo(() => publicApps.filter(app => app.status === 'live').length, [publicApps]);
  const buildingAppsCount = useMemo(() => publicApps.filter(app => app.status === 'building').length, [publicApps]);
  const scannedAppsCount = useMemo(() => publicApps.filter(app => app.scan_timestamp).length, [publicApps]);

  return (
    <div className="min-h-screen flex flex-col bg-cyber-black">
      <NavBar activePage="dashboard" />

      <div className="relative overflow-hidden bg-cyber-black border-b border-cyber-light">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(0,243,255,0.16),transparent_28%),radial-gradient(circle_at_85%_0%,rgba(57,255,20,0.1),transparent_32%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-neon-blue">The Stackhouse</p>
              <h1 className="mt-3 text-4xl md:text-5xl font-extrabold text-white tracking-tight" data-testid="text-dashboard-title" data-agent-id="dashboard-heading">
                Verified indie apps with public proof.
              </h1>
              <p className="mt-4 text-gray-400 text-lg leading-relaxed">
                Vetted browser-ready tools, human-reviewed. Live apps show readiness scans (twelve checks, tier labels), embed badges, and crawler-visible proof pages.
              </p>
            </div>

            <Link
              href="/for-builders"
              className="inline-flex justify-center items-center px-6 py-3 bg-neon-green text-black font-extrabold rounded-sm uppercase tracking-wide hover:bg-white transition-all shadow-[0_0_22px_rgba(57,255,20,0.28)]"
            >
              List Your App Free
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              ['Live apps', liveAppsCount],
              ['Works in progress', buildingAppsCount],
              ['With technical audit', scannedAppsCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-cyber-light bg-cyber-dark/70 px-5 py-4">
                <div className="text-2xl font-extrabold text-white">{value}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        <div id="directory">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 rounded-2xl border border-cyber-light bg-cyber-gray/70 p-4 md:p-5">
            <div>
              <h2 className="text-2xl font-bold text-white">Vetted registry</h2>
              <p className="text-gray-400 mt-2">Search verified live tools and approved works in progress.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search verified apps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-cyber-dark border-cyber-light text-white w-full sm:w-64"
                  data-testid="input-search"
                  data-agent-id="directory-search"
                />
                <svg className="w-5 h-5 text-gray-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-cyber-dark border-cyber-light text-white w-full sm:w-40" data-testid="select-category" data-agent-id="directory-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'newest' | 'rating')}>
                <SelectTrigger className="bg-cyber-dark border-cyber-light text-white w-full sm:w-40" data-testid="select-sort" data-agent-id="directory-sort">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {appsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto"></div>
            </div>
          ) : filteredPublicApps.length === 0 ? (
            <div className="text-center py-12 bg-cyber-dark border border-cyber-light rounded-lg">
              <p className="text-gray-400">No apps found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-agent-id="directory-grid">
              {filteredPublicApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
