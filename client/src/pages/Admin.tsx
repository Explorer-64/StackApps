import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useAppStore } from '@/lib/appStore';
import { isAdmin } from '@/lib/admins';
import type { App, ModerationStatus } from '@shared/schema';
import { SiteFooter } from '@/components/SiteFooter';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NoIndex } from '@/components/NoIndex';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { collection, getDocs } from 'firebase/firestore';
import { initializeFirebase, getFirestoreDb } from '@/lib/firebase';
import { READINESS_LAB_CHECKS } from '@/utils/readinessLabs';
import { McpBlueprintTestPanel } from '@/pages/McpBlueprintTest';

type SortOption = 'newest' | 'highest_rated';
type AdminTab = ModerationStatus | 'admins' | 'analytics' | 'mcp_test';

export default function Admin() {
  const { user, loading } = useCurrentUser();
  const [, setLocation] = useLocation();
  const { adminApps, updateApp, deleteApp, subscribeToAllApps, isLoading } = useAppStore();
  
  const SUPER_ADMIN_EMAILS = ["stackapps.app@gmail.com"];
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user?.email ?? '');

  const [activeTab, setActiveTab] = useState<AdminTab>('pending_review');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [rescanStates, setRescanStates] = useState<Record<string, 'idle' | 'running' | 'done' | 'failed'>>({});
  const [adminList, setAdminList] = useState<Array<{ uid: string; email?: string; grantedAt?: string }>>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminActionState, setAdminActionState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [scanStats, setScanStats] = useState<{
    total: number;
    converted: number;
    avgDaysToConvert: number;
  } | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin(user))) {
      setLocation('/');
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    const unsubscribe = subscribeToAllApps();
    return () => unsubscribe();
  }, [subscribeToAllApps]);

  useEffect(() => {
    if (!user || !isSuperAdmin) return;
    if (activeTab !== 'admins') return;

    setAdminActionState('loading');
    (async () => {
      try {
        const functions = getFunctions(getApp());
        const listAdmins = httpsCallable(functions, 'listAdmins');
        const result = await listAdmins({});
        setAdminList((result.data as any[])?.map((item) => ({
          uid: String(item.uid ?? ''),
          email: typeof item.email === 'string' ? item.email : undefined,
          grantedAt: typeof item.grantedAt === 'string' ? item.grantedAt : undefined,
        })) ?? []);
        setAdminActionState('idle');
      } catch {
        setAdminActionState('error');
      }
    })();
  }, [activeTab, user, isSuperAdmin]);

  useEffect(() => {
    if (!user || !isSuperAdmin || activeTab !== 'analytics') return;
    setScanStats(null);
    (async () => {
      try {
        await initializeFirebase();
        const db = await getFirestoreDb();
        const snap = await getDocs(collection(db, 'free_scans'));
        let total = 0;
        let converted = 0;
        let sumDays = 0;
        let convertCount = 0;
        snap.forEach((d) => {
          total++;
          const data = d.data();
          if (data.converted === true) {
            converted++;
            const ca = data.converted_at;
            const st = data.scan_timestamp;
            const end =
              typeof ca === 'string'
                ? new Date(ca)
                : ca && typeof (ca as { toDate?: () => Date }).toDate === 'function'
                  ? (ca as { toDate: () => Date }).toDate()
                  : null;
            const start =
              typeof st === 'string'
                ? new Date(st)
                : st && typeof (st as { toDate?: () => Date }).toDate === 'function'
                  ? (st as { toDate: () => Date }).toDate()
                  : null;
            if (end && start && !Number.isNaN(end.getTime()) && !Number.isNaN(start.getTime())) {
              sumDays += (end.getTime() - start.getTime()) / 86400000;
              convertCount++;
            }
          }
        });
        const avgDaysToConvert =
          convertCount > 0 ? Math.round((sumDays / convertCount) * 10) / 10 : 0;
        setScanStats({ total, converted, avgDaysToConvert });
      } catch {
        setScanStats({ total: 0, converted: 0, avgDaysToConvert: 0 });
      }
    })();
  }, [activeTab, user, isSuperAdmin]);

  const safeUpdate = async (id: string, data: Parameters<typeof updateApp>[1]) => {
    try {
      await updateApp(id, data);
    } catch (e) {
      alert(`Update failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleReject = async (app: App) => {
    const reason = prompt("Reason for rejection (optional):");
    if (reason !== null) {
        await updateApp(app.id, {
            moderationStatus: 'rejected',
            rejectionReason: reason || undefined,
        });
    }
  };

  const toggleFeatured = async (app: App) => {
    await updateApp(app.id, {
        isFeatured: !app.isFeatured
    });
  };

  const handleAdminRescan = async (appId: string) => {
    setRescanStates(prev => ({ ...prev, [appId]: 'running' }));
    try {
      const functions = getFunctions(getApp());
      const manualRescan = httpsCallable(functions, 'manualRescan');
      await manualRescan({ appId });
      setRescanStates(prev => ({ ...prev, [appId]: 'done' }));
      window.setTimeout(() => setRescanStates(prev => ({ ...prev, [appId]: 'idle' })), 2000);
    } catch {
      setRescanStates(prev => ({ ...prev, [appId]: 'failed' }));
      window.setTimeout(() => setRescanStates(prev => ({ ...prev, [appId]: 'idle' })), 2000);
    }
  };

  const handleGrantAdmin = async (email: string) => {
    if (!user || !isSuperAdmin) return;
    setAdminActionState('loading');
    try {
      const functions = getFunctions(getApp());
      const grantAdmin = httpsCallable(functions, 'grantAdmin');
      await grantAdmin({ email });
      const listAdmins = httpsCallable(functions, 'listAdmins');
      const result = await listAdmins({});
      setAdminList((result.data as any[])?.map((item) => ({
        uid: String(item.uid ?? ''),
        email: typeof item.email === 'string' ? item.email : undefined,
        grantedAt: typeof item.grantedAt === 'string' ? item.grantedAt : undefined,
      })) ?? []);
      setNewAdminEmail('');
      setAdminActionState('done');
      window.setTimeout(() => setAdminActionState('idle'), 1500);
    } catch {
      setAdminActionState('error');
      window.setTimeout(() => setAdminActionState('idle'), 1500);
    }
  };

  const handleRevokeAdmin = async (uid: string) => {
    if (!user || !isSuperAdmin) return;
    setAdminActionState('loading');
    try {
      const functions = getFunctions(getApp());
      const revokeAdmin = httpsCallable(functions, 'revokeAdmin');
      await revokeAdmin({ uid });
      const listAdmins = httpsCallable(functions, 'listAdmins');
      const result = await listAdmins({});
      setAdminList((result.data as any[])?.map((item) => ({
        uid: String(item.uid ?? ''),
        email: typeof item.email === 'string' ? item.email : undefined,
        grantedAt: typeof item.grantedAt === 'string' ? item.grantedAt : undefined,
      })) ?? []);
      setAdminActionState('done');
      window.setTimeout(() => setAdminActionState('idle'), 1500);
    } catch {
      setAdminActionState('error');
      window.setTimeout(() => setAdminActionState('idle'), 1500);
    }
  };

  const filteredApps = adminApps.filter(app => {
      if (activeTab === 'admins' || activeTab === 'analytics' || activeTab === 'mcp_test') return false;
      const status = app.moderationStatus || 'pending_review';
      return status === activeTab;
  });

  const sortedApps = [...filteredApps].sort((a, b) => {
    if (sortBy === 'highest_rated') {
        const ratingA = a.averageRating || 0;
        const ratingB = b.averageRating || 0;
        if (ratingA === ratingB) {
            return (b.ratingCount || 0) - (a.ratingCount || 0);
        }
        return ratingB - ratingA;
    }
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  if (loading) {
    return <div className="min-h-screen bg-cyber-black flex items-center justify-center text-neon-blue">Loading...</div>;
  }

  if (!user || !isAdmin(user)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NoIndex />
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div className="flex items-center gap-4">
                <div className="bg-red-100 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900" data-testid="text-admin-title">Moderation Queue</h1>
                    <p className="text-sm text-gray-500">Super Admin Area</p>
                </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm text-gray-500">Logged in as: {user.email}</span>
                <Link href="/" className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium">
                  Exit to Gallery
                </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 gap-4">
            <div className="flex space-x-6 overflow-x-auto pb-1 w-full sm:w-auto">
                {(['pending_review', 'approved', 'rejected'] as ModerationStatus[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`whitespace-nowrap shrink-0 pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === tab
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                        data-testid={`tab-${tab}`}
                    >
                        {tab.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        <span className="ml-2 py-0.5 px-2.5 rounded-full text-xs bg-gray-100 text-gray-600">
                            {adminApps.filter(a => (a.moderationStatus || 'pending_review') === tab).length}
                        </span>
                    </button>
                ))}
                {isSuperAdmin && (
                  <button
                    key="admins"
                    onClick={() => setActiveTab('admins')}
                    className={`whitespace-nowrap shrink-0 pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'admins'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    data-testid="tab-admins"
                  >
                    Admins
                  </button>
                )}
                {isSuperAdmin && (
                  <button
                    key="analytics"
                    onClick={() => setActiveTab('analytics')}
                    className={`whitespace-nowrap shrink-0 pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'analytics'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    data-testid="tab-analytics"
                  >
                    Analytics
                  </button>
                )}
                {isSuperAdmin && (
                  <button
                    key="mcp_test"
                    onClick={() => setActiveTab('mcp_test')}
                    className={`whitespace-nowrap shrink-0 pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'mcp_test'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    data-testid="tab-mcp-test"
                  >
                    MCP Test
                  </button>
                )}
            </div>

            {activeTab !== 'admins' && activeTab !== 'analytics' && activeTab !== 'mcp_test' && (
            <div className="flex items-center gap-2 pb-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="highest_rated">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {activeTab === 'admins' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">Granted Admins</h2>
                <p className="text-sm text-gray-500">Grant access by email. Revoke by UID.</p>
              </div>
              <div className="text-sm text-gray-500">
                {adminActionState === 'loading'
                  ? 'Loading…'
                  : adminActionState === 'done'
                    ? 'Done!'
                    : adminActionState === 'error'
                      ? 'Error'
                      : ''}
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <input
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="email@example.com"
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <Button
                onClick={() => handleGrantAdmin(newAdminEmail)}
                disabled={adminActionState === 'loading'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Grant
              </Button>
            </div>

            <div className="mt-6 space-y-3">
              {adminList.length === 0 ? (
                <p className="text-sm text-gray-500">No granted admins yet.</p>
              ) : (
                adminList.map((admin) => (
                  <div key={admin.uid} className="flex items-center justify-between gap-3 border border-gray-200 rounded p-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900">
                        {(admin.email ?? '(no email)')} <span className="text-gray-400">({admin.uid.slice(0, 8)}…)</span>
                      </div>
                      {admin.grantedAt && <div className="text-xs text-gray-500">Granted: {admin.grantedAt}</div>}
                    </div>
                    <Button
                      onClick={() => handleRevokeAdmin(admin.uid)}
                      disabled={adminActionState === 'loading'}
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                    >
                      Revoke
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : activeTab === 'analytics' ? (
          scanStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
              {[
                ['Free scans', scanStats.total],
                ['Converted', scanStats.converted],
                ['Conversion rate', `${scanStats.total > 0 ? Math.round((scanStats.converted / scanStats.total) * 100) : 0}%`],
                ['Avg days to convert', scanStats.avgDaysToConvert > 0 ? `${scanStats.avgDaysToConvert}d` : '—'],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                  <div className="text-sm text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-gray-500">Loading…</div>
          )
        ) : activeTab === 'mcp_test' ? (
          <div className="bg-cyber-black rounded-lg border border-cyber-light p-6">
            <h2 className="text-lg font-bold text-white mb-1">MCP Blueprint Test</h2>
            <p className="text-sm text-gray-400 mb-6">
              Measures whether publishing a blueprint.txt reduces AI agent context overhead.
            </p>
            {user && <McpBlueprintTestPanel user={user} />}
          </div>
        ) : isLoading ? (
            <div className="text-center py-12">Loading...</div>
        ) : sortedApps.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                <p className="text-gray-500">No applications in this queue.</p>
            </div>
        ) : (
            <div className="space-y-4">
                {sortedApps.map((app) => (
                    <div key={app.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md" data-testid={`admin-app-${app.id}`}>
                        <div className="flex justify-between items-start gap-6 flex-wrap">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-4 flex-wrap">
                                    {app.thumbnailUrl && (
                                        <img src={app.thumbnailUrl} alt="" className="w-16 h-16 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                                            {app.name}
                                            {app.averageRating ? (
                                                <span className="flex items-center gap-1 text-sm bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded border border-yellow-200">
                                                    ★ {app.averageRating.toFixed(1)} ({app.ratingCount})
                                                </span>
                                            ) : null}
                                            <a href={app.appUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        </h3>
                                        <p className="text-gray-600 mt-1 line-clamp-2">{app.description}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {app.tags?.map(tag => (
                                                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                                Owner: {app.ownerId.slice(0, 8)}...
                                            </span>
                                        </div>
                                        <div className="mt-4 rounded-lg border-2 border-dashed border-purple-500 bg-purple-50 p-3">
                                            <div className="text-xs font-bold text-purple-950 mb-1">Labs (internal)</div>
                                            <p className="text-[11px] text-purple-800/90 mb-2">
                                                Emerging signals — not public tiers. Shown after any Site Readiness scan (live approval or{' '}
                                                <span className="font-semibold">Re-run scan</span> on the Approved tab).
                                            </p>
                                            {!app.scan_timestamp ? (
                                                <p className="text-xs text-amber-800 bg-amber-100 border border-amber-300 rounded px-2 py-1.5 mb-2">
                                                    No scan on file yet for this app — run <span className="font-semibold">Re-run scan</span> on the
                                                    right (Approved tab) to populate labs.
                                                </p>
                                            ) : null}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                                {READINESS_LAB_CHECKS.map((lab) => (
                                                    <div key={lab.field} className="flex items-center justify-between gap-1 text-gray-800">
                                                        <span className="truncate" title={lab.note}>
                                                            {lab.label}
                                                        </span>
                                                        <span className={app[lab.field] === true ? 'text-green-700 font-bold' : 'text-gray-400'}>
                                                            {app[lab.field] === true ? '✓' : '—'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 min-w-[140px]">
                                {activeTab === 'pending_review' && (
                                    <>
                                        <Button
                                            onClick={() => {
                                                if (confirm(`Approve "${app.name}" as LIVE?`)) {
                                                    void safeUpdate(app.id, {
                                                        moderationStatus: 'approved',
                                                        status: 'live',
                                                        safetyVerified: true,
                                                    });
                                                }
                                            }}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                                            data-testid={`button-approve-live-${app.id}`}
                                        >
                                            Approve (Live)
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                if (confirm(`Approve "${app.name}" as BUILDING?`)) {
                                                    void safeUpdate(app.id, {
                                                        moderationStatus: 'approved',
                                                        status: 'building',
                                                        safetyVerified: false,
                                                    });
                                                }
                                            }}
                                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                                            data-testid={`button-approve-building-${app.id}`}
                                        >
                                            Approve (Building)
                                        </Button>
                                        <Button
                                            onClick={() => handleReject(app)}
                                            variant="outline"
                                            className="w-full border-red-200 text-red-700 hover:bg-red-50"
                                            data-testid={`button-reject-${app.id}`}
                                        >
                                            Reject
                                        </Button>
                                    </>
                                )}

                                {activeTab === 'approved' && (
                                    <>
                                        {app.status === 'building' && (
                                            <Button
                                                onClick={() => {
                                                    if (confirm(`Upgrade "${app.name}" to Live?`)) {
                                                        void safeUpdate(app.id, {
                                                            status: 'live',
                                                            safetyVerified: true,
                                                        });
                                                    }
                                                }}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                Upgrade to Live
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => toggleFeatured(app)}
                                            variant={app.isFeatured ? "default" : "outline"}
                                            className={app.isFeatured ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                                            data-testid={`button-feature-${app.id}`}
                                        >
                                            {app.isFeatured ? 'Featured' : 'Feature'}
                                        </Button>
                                        <Button
                                            onClick={() => handleAdminRescan(app.id)}
                                            disabled={rescanStates[app.id] === 'running'}
                                            variant="outline"
                                            className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                            data-agent-id={`admin-rescan-${app.id}`}
                                        >
                                            {rescanStates[app.id] === 'running' ? 'Scanning...' : rescanStates[app.id] === 'done' ? 'Done!' : rescanStates[app.id] === 'failed' ? 'Failed' : 'Re-run scan'}
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                if (confirm(`Move "${app.name}" back to Pending Review?`)) {
                                                    void safeUpdate(app.id, { moderationStatus: 'pending_review' });
                                                }
                                            }}
                                            variant="outline"
                                            className="border-red-200 text-red-700 hover:bg-red-50"
                                        >
                                            Revoke
                                        </Button>
                                    </>
                                )}

                                {activeTab === 'rejected' && (
                                    <Button
                                        onClick={() => {
                                            if (confirm(`Move "${app.name}" back to Pending Review?`)) {
                                                updateApp(app.id, { moderationStatus: 'pending_review' });
                                            }
                                        }}
                                        variant="outline"
                                    >
                                        Reconsider
                                    </Button>
                                )}
                                
                                <Button
                                    onClick={() => {
                                        if (confirm(`PERMANENTLY delete "${app.name}"?`)) {
                                            deleteApp(app.id);
                                        }
                                    }}
                                    variant="ghost"
                                    className="text-gray-400 hover:text-red-600"
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
      
      <SiteFooter />
    </div>
  );
}
