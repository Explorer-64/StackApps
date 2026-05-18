import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'wouter';
import { getApp } from 'firebase/app';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useAppStore } from '@/lib/appStore';
import { initializeFirebase, getFirestoreDb, getFirebaseAuth } from '@/lib/firebase';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { AppSubmitForm } from '@/components/AppSubmitForm';
import { MyReviewsList } from '@/components/MyReviewsList';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { App, Review } from '@shared/schema';
import { NoIndex } from '@/components/NoIndex';
import { isManualRescanCooldownError } from '@/utils/manualRescanErrors';

type RescanState = 'idle' | 'running' | 'done' | 'cooldown' | 'failed';

export default function Hub() {
  const { user, loading: authLoading } = useCurrentUser();
  const [, setLocation] = useLocation();
  const { myApps, addApp, updateApp, deleteApp, subscribeToMyApps, isLoading: appsLoading } = useAppStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [reviewAppNames, setReviewAppNames] = useState<Record<string, string>>({});
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewEditData, setReviewEditData] = useState({ rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [requestingLiveReviewId, setRequestingLiveReviewId] = useState<string | null>(null);
  const [rescanStates, setRescanStates] = useState<Record<string, RescanState>>({});
  const [rescanCooldownOpen, setRescanCooldownOpen] = useState(false);
  const [rescanCooldownAppName, setRescanCooldownAppName] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/login');
    }
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    if (user) return subscribeToMyApps(user.uid);
  }, [user, subscribeToMyApps]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let firestoreUnsub: (() => void) | undefined;

    (async () => {
      try {
        await initializeFirebase();
        const db = await getFirestoreDb();
        if (cancelled) return;
        const q = query(collection(db, 'reviews'), where('userId', '==', user.uid));
        firestoreUnsub = onSnapshot(q, async (snapshot) => {
          const reviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Review[];
          reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setMyReviews(reviews);
          const missingAppIds = reviews.map(r => r.appId).filter(id => !reviewAppNames[id]);
          if (missingAppIds.length > 0) {
            const fetches = missingAppIds.map(id => getDoc(doc(db, 'apps', id)));
            const docs = await Promise.all(fetches);
            const names: Record<string, string> = {};
            docs.forEach(d => { if (d.exists()) names[d.id] = (d.data() as App).name; });
            setReviewAppNames(prev => ({ ...prev, ...names }));
          }
        });
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      cancelled = true;
      firestoreUnsub?.();
    };
  }, [user]);

  const handleUpdateReview = async (review: Review) => {
    if (!user) return;
    setReviewSubmitting(true);
    try {
      const token = await getFirebaseAuth().currentUser?.getIdToken();
      const res = await fetch('/api/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          appId: review.appId,
          rating: reviewEditData.rating,
          comment: reviewEditData.comment,
          userName: user.displayName || 'Anonymous',
          userAvatarUrl: user.photoURL || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to update review');
      setEditingReviewId(null);
    } catch (e) {
      console.error(e);
      alert('Failed to update review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (appId: string, appName: string) => {
    if (!confirm(`Delete your review for "${appName}"?`)) return;
    try {
      const token = await getFirebaseAuth().currentUser?.getIdToken();
      const res = await fetch(`/api/review/${appId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete review');
    } catch (e) {
      console.error(e);
      alert('Failed to delete review. Please try again.');
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-cyber-black text-neon-blue">Loading...</div>;
  }

  if (!user) return null;

  const resetForm = () => {
    setEditingApp(null);
    setIsFormOpen(false);
  };

  const handleEdit = (app: App) => {
    setEditingApp(app);
    setIsFormOpen(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleSubmit = async (appData: Omit<App, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      if (editingApp) {
        await updateApp(editingApp.id, appData);
      } else {
        await addApp({ ...appData, ownerId: user.uid });
      }
      resetForm();
    } catch (error) {
      console.error('Error saving app:', error);
      alert('Failed to save app. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteApp(id);
      } catch (error) {
        console.error('Error deleting app:', error);
        alert('Failed to delete app. Please try again.');
      }
    }
  };

  const handleRequestLiveReview = async (appId: string) => {
    if (!confirm("Submit this app for live review? We'll check it and approve it as live if it meets the requirements.")) return;

    setRequestingLiveReviewId(appId);
    try {
      await updateApp(appId, { moderationStatus: 'pending_review' });
    } finally {
      setRequestingLiveReviewId(null);
    }
  };

  const setRescanState = (appId: string, state: RescanState) => {
    setRescanStates(prev => ({ ...prev, [appId]: state }));
  };

  const handleRescan = async (appId: string) => {
    setRescanState(appId, 'running');

    try {
      const functions = getFunctions(getApp());
      const manualRescan = httpsCallable(functions, 'manualRescan');
      await manualRescan({ appId });
      setRescanState(appId, 'done');
      window.setTimeout(() => setRescanState(appId, 'idle'), 2000);
    } catch (error) {
      if (isManualRescanCooldownError(error)) {
        const app = myApps.find((a) => a.id === appId);
        setRescanCooldownAppName(app?.name ?? 'This app');
        setRescanCooldownOpen(true);
        setRescanState(appId, 'idle');
        return;
      }
      setRescanState(appId, 'failed');
      window.setTimeout(() => setRescanState(appId, 'idle'), 2000);
    }
  };

  const getRescanLabel = (state: RescanState = 'idle') => {
    if (state === 'running') return 'Running...';
    if (state === 'done') return 'Done!';
    if (state === 'failed') return 'Failed';
    return 'Re-run scan';
  };

  return (
    <div className="min-h-screen flex flex-col bg-cyber-black">
      <NoIndex />
      <NavBar activePage="hub" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-hub-welcome" data-agent-id="hub-heading">
            My Apps
          </h1>
          <p className="text-gray-400">Apps you&apos;re getting verified on The Stackhouse</p>
          <p className="mt-3 text-sm text-gray-500">
            <Link href="/scan" className="text-neon-blue hover:text-neon-green font-medium">
              Free AI readiness scan
            </Link>
            {' — '}audit any live URL before you list (one scan per domain).
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
            <div />
            {!isFormOpen && (
              <Button
                onClick={() => setIsFormOpen(true)}
                className="bg-neon-green hover:bg-white text-black font-bold"
                data-testid="button-submit-new"
                data-agent-id="hub-submit-new-app"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Submit New App
              </Button>
            )}
          </div>

          {isFormOpen && (
            <div ref={formRef}>
              <AppSubmitForm
                editingApp={editingApp}
                ownerId={user.uid}
                onSubmit={handleSubmit}
                onCancel={resetForm}
                isSubmitting={isSubmitting}
              />
            </div>
          )}

          <div className="bg-cyber-gray rounded-lg shadow-lg overflow-hidden border border-cyber-light" data-agent-id="hub-my-projects">
            <div className="px-6 py-4 border-b border-cyber-light bg-cyber-dark">
              <h3 className="text-lg font-bold text-white">My Projects ({myApps.length})</h3>
            </div>

            {appsLoading ? (
              <div className="p-12 text-center text-gray-400">Loading your projects...</div>
            ) : myApps.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <p className="text-lg">No apps yet.</p>
                <p className="mt-2 text-sm">Click "Submit New App" above to add your first project!</p>
              </div>
            ) : (
              <div className="divide-y divide-cyber-light">
                {myApps.map((app) => (
                  <div key={app.id} className="p-6 hover:bg-cyber-dark transition-colors" data-testid={`my-app-${app.id}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      {app.thumbnailUrl && (
                        <div className="flex-shrink-0">
                          <img src={app.thumbnailUrl} alt={app.name} className="w-16 h-16 rounded-sm object-cover border border-cyber-light" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <Link href={`/app/${app.id}`} className="text-lg font-bold text-white hover:text-neon-blue transition-colors">
                            {app.name}
                          </Link>
                          {app.status && <span className={`px-2 py-0.5 rounded-sm text-xs font-bold uppercase tracking-wide border ${app.status === 'live' ? 'bg-green-900/30 text-neon-green border-green-800' : app.status === 'building' ? 'bg-blue-900/30 text-neon-blue border-blue-800' : 'bg-yellow-900/30 text-neon-yellow border-yellow-800'}`}>{app.status}</span>}
                          {app.moderationStatus && <span className={`px-2 py-0.5 rounded-sm text-xs font-bold uppercase tracking-wide border ${app.moderationStatus === 'approved' ? 'bg-green-900/30 text-neon-green border-green-800' : app.moderationStatus === 'rejected' ? 'bg-red-900/30 text-red-500 border-red-800' : 'bg-orange-900/30 text-orange-400 border-orange-800'}`}>{app.moderationStatus.replace('_', ' ')}</span>}
                        </div>
                        {app.moderationStatus === 'approved' && app.status === 'building' && (
                          <p className="text-xs text-gray-500 mb-2">App approved as building — finish your app and use Request Live Review when ready. Live approval unlocks your backlink, live embed badge, and full twelve-check scan with tiers.</p>
                        )}
                        {app.moderationStatus === 'rejected' && app.rejectionReason && (
                          <p className="text-red-400 text-xs mb-2">Rejection reason: {app.rejectionReason}</p>
                        )}
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{app.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {app.tags?.map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-cyber-light text-gray-300 text-xs rounded-sm border border-cyber-light">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0 flex-wrap">
                        <Button
                          onClick={() => handleEdit(app)}
                          variant="outline"
                          size="sm"
                          className="border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black"
                          data-testid={`button-edit-${app.id}`}
                        >
                          Edit
                        </Button>
                        {app.status === 'building' && app.moderationStatus === 'approved' && (
                          <Button
                            onClick={() => handleRequestLiveReview(app.id)}
                            disabled={requestingLiveReviewId === app.id}
                            variant="outline"
                            size="sm"
                            className="border-neon-green text-neon-green hover:bg-neon-green hover:text-black"
                            data-agent-id={`request-live-review-${app.id}`}
                          >
                            {requestingLiveReviewId === app.id ? 'Requesting...' : 'Request Live Review'}
                          </Button>
                        )}
                        {app.status === 'live' && app.moderationStatus === 'approved' && (
                          <Button
                            onClick={() => handleRescan(app.id)}
                            disabled={rescanStates[app.id] === 'running'}
                            variant="outline"
                            size="sm"
                            className="border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-black"
                            data-agent-id={`rescan-button-${app.id}`}
                          >
                            {getRescanLabel(rescanStates[app.id])}
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDelete(app.id, app.name)}
                          variant="outline"
                          size="sm"
                          className="border-cyber-light text-gray-400 hover:text-red-500 hover:border-red-500"
                          data-testid={`button-delete-${app.id}`}
                        >
                          Delete
                        </Button>
                      </div>

                      {app.status === 'live' && app.moderationStatus === 'approved' && app.scan_timestamp && (
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={app.scan_public === true}
                            aria-label="Show detailed readiness checklist on your public listing"
                            onClick={() => updateApp(app.id, { scan_public: !app.scan_public })}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${app.scan_public ? 'bg-neon-green' : 'bg-cyber-light'}`}
                            data-agent-id={`scan-public-toggle-${app.id}`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${app.scan_public ? 'translate-x-4' : 'translate-x-0'}`}
                            />
                          </button>
                          <div>
                            <p className={`text-xs font-medium ${app.scan_public ? 'text-neon-green' : 'text-gray-400'}`}>
                              {app.scan_public ? 'Checklist visible on listing' : 'Checklist hidden from listing'}
                            </p>
                            <p className="text-xs text-gray-600">Badges and tier always shown regardless</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <MyReviewsList
          reviews={myReviews}
          reviewAppNames={reviewAppNames}
          onEdit={(review) => { setEditingReviewId(review.id); setReviewEditData({ rating: review.rating, comment: review.comment }); }}
          onCancelEdit={() => setEditingReviewId(null)}
          onDelete={handleDeleteReview}
          editingReviewId={editingReviewId}
          reviewEditData={reviewEditData}
          onReviewEditChange={setReviewEditData}
          onReviewSave={handleUpdateReview}
          reviewSubmitting={reviewSubmitting}
        />
      </main>

      <SiteFooter />

      <AlertDialog open={rescanCooldownOpen} onOpenChange={setRescanCooldownOpen}>
        <AlertDialogContent className="bg-cyber-gray border border-cyber-light text-white sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">One scan every 24 hours</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300 text-left space-y-2">
              <span className="block">
                <span className="font-semibold text-white">{rescanCooldownAppName}</span> can only be rescanned once per day. That keeps load fair for everyone.
              </span>
              <span className="block">
                Fix your live site, wait until 24 hours have passed since the last check, then tap <span className="text-neon-blue font-medium">Re-run scan</span> again.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className="bg-neon-blue text-black hover:bg-white font-bold"
              onClick={() => setRescanCooldownOpen(false)}
            >
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
