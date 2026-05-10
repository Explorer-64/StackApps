import { useEffect, useState } from 'react';
import { useRoute, Link } from 'wouter';
import { setPageSeo } from '@/utils/seo';
import { doc, onSnapshot, collection, query, where, type Firestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { initializeFirebase, getFirestoreDb, getFirebaseAuth } from '@/lib/firebase';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { App } from '@shared/schema';
import { SiteFooter } from '@/components/SiteFooter';
import { NoIndex } from '@/components/NoIndex';
import { ReadinessScan, type RescanState } from '@/components/ReadinessScan';
import { BadgeEmbed } from '@/components/BadgeEmbed';
import { ReviewSection } from '@/components/ReviewSection';
import { ReportForm } from '@/components/ReportForm';

export default function AppDetails() {
  const [matchById, params] = useRoute('/app/:id');
  const [matchBySlug, slugParams] = useRoute('/apps/:slug');
  const idParam = params?.id ?? null;
  const slugParam = slugParams?.slug ?? null;
  const { user, loading: authLoading } = useCurrentUser();

  const [app, setApp] = useState<App | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  const [rescanState, setRescanState] = useState<RescanState>('idle');

  useEffect(() => {
    initializeFirebase().then(() => {
      setDb(getFirestoreDb());
    }).catch(err => {
      console.error("Failed to init Firestore:", err);
      setError("Failed to connect to database");
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!db || (!idParam && !slugParam)) return;

    setLoading(true);

    if (idParam) {
      const appRef = doc(db, 'apps', idParam);
      const unsub = onSnapshot(appRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setApp({
            id: snapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            scan_timestamp: data.scan_timestamp?.toDate?.()?.toISOString() ?? undefined,
          } as App);
          setDocId(snapshot.id);
          setError(null);
        } else {
          setError('App not found');
        }
        setLoading(false);
      }, (err) => {
        console.error('Error fetching app:', err);
        setError('Failed to load app');
        setLoading(false);
      });
      return () => unsub();
    }

    if (slugParam) {
      const q = query(collection(db, 'apps'), where('slug', '==', slugParam));
      const unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data();
          setApp({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            scan_timestamp: data.scan_timestamp?.toDate?.()?.toISOString() ?? undefined,
          } as App);
          setDocId(docSnap.id);
          setError(null);
        } else {
          setError('App not found');
        }
        setLoading(false);
      }, (err) => {
        console.error('Error fetching app:', err);
        setError('Failed to load app');
        setLoading(false);
      });
      return () => unsub();
    }
  }, [idParam, slugParam, db]);

  useEffect(() => {
    if (app) {
      const plain = (app.description || '').replace(/\s+/g, ' ').trim();
      const desc =
        plain.slice(0, 160) ||
        `${app.name} — PWA SaaS listing on StackApps. Open the live app, read reviews, and see ratings.`;
      setPageSeo(`${app.name} · StackApps`, desc);
      return;
    }
    if (loading && (idParam || slugParam)) {
      setPageSeo(
        'App listing · StackApps',
        'Loading a StackApps directory listing: description, reviews, and link to the live product.',
      );
      return;
    }
    if (idParam || slugParam) {
      setPageSeo(
        'Listing not found · StackApps',
        'This StackApps directory listing is missing or unavailable. Browse other PWA SaaS listings from the home page.',
      );
    }
  }, [app, loading, idParam, slugParam]);

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!user || !docId) return;
    const auth = getFirebaseAuth();
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch('/api/rate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        appId: docId,
        rating,
        comment,
        userName: user.displayName || "Anonymous",
        userAvatarUrl: user.photoURL || undefined
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit review');
    }
  };

  const handleRescan = async () => {
    if (!docId) return;

    setRescanState('running');
    try {
      const functions = getFunctions(getApp());
      const manualRescan = httpsCallable(functions, 'manualRescan');
      await manualRescan({ appId: docId });
      setRescanState('done');
      window.setTimeout(() => setRescanState('idle'), 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const state = message.includes('24 hours') ? 'cooldown' : 'failed';
      setRescanState(state);
      window.setTimeout(() => setRescanState('idle'), state === 'cooldown' ? 3000 : 2000);
    }
  };

  if ((!idParam && !slugParam) || (!matchById && !matchBySlug)) return (
    <div className="min-h-screen bg-cyber-black flex items-center justify-center">
        <p className="text-gray-500 text-xl">Invalid App ID</p>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-cyber-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
    </div>
  );

  if (error || !app) return (
    <div className="min-h-screen bg-cyber-black flex flex-col items-center justify-center gap-4">
        <NoIndex />
        <p className="text-red-500 text-xl">App not found or error loading data.</p>
        <Link href="/" className="text-neon-blue hover:text-white hover:underline">Go Home</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-cyber-black flex flex-col">
        <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
            <Link href="/" className="text-neon-blue hover:text-white mb-4 inline-block font-medium transition-colors" data-testid="link-back">
              Back to Home
            </Link>
            
            <div className="bg-cyber-gray rounded-xl shadow-lg border border-cyber-light p-6 md:p-8 mb-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-1/3 flex-shrink-0">
                        <div className="aspect-video bg-cyber-black rounded-lg overflow-hidden border border-cyber-light relative group shadow-inner">
                           {app.thumbnailUrl ? (
                             <img src={app.thumbnailUrl} alt={app.name} className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-cyber-light">{app.name.charAt(0)}</div>
                           )}
                           {app.isFeatured && (
                               <div className="absolute top-2 left-2 bg-neon-purple/20 border border-neon-purple text-neon-purple text-xs font-bold px-2 py-1 rounded-sm shadow-sm backdrop-blur-sm">
                                   FEATURED
                               </div>
                           )}
                        </div>
                        
                        <div className="mt-4 flex flex-col gap-2">
                            <a 
                                href={app.appUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full bg-neon-blue text-black font-bold text-center py-3 rounded-sm hover:bg-white transition-all shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                                data-testid="link-launch-app"
                                data-agent-id="app-detail-launch"
                            >
                                Launch App
                            </a>
                            
                            {user && user.uid === app.ownerId && (
                                <Link 
                                    href="/dashboard"
                                    className="w-full bg-transparent border border-neon-blue text-neon-blue font-bold text-center py-3 rounded-sm hover:bg-neon-blue/10 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    Edit App
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="w-full md:w-2/3 flex flex-col">
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                            <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-app-name" data-agent-id="app-detail-name">{app.name}</h1>
                            {app.status === 'building' && (
                                <span className="bg-yellow-900/30 text-neon-yellow text-xs font-bold px-2 py-1 rounded-sm uppercase border border-yellow-800">
                                    Building
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-4 mb-6 flex-wrap">
                             <div className="flex items-center bg-cyber-black px-3 py-1.5 rounded-sm border border-cyber-light">
                                 <span className="text-neon-yellow text-xl mr-1.5">★</span>
                                 <span className="font-bold text-white text-lg">{app.averageRating ? app.averageRating.toFixed(1) : "New"}</span>
                                 <span className="text-gray-500 text-sm ml-1.5">({app.ratingCount || 0} reviews)</span>
                             </div>
                             
                             {app.category && (
                                 <span className="bg-cyber-light text-gray-300 px-3 py-1.5 rounded-sm text-sm font-medium border border-cyber-light">
                                     {app.category}
                                 </span>
                             )}
                        </div>

                        <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-lg mb-6 flex-grow" data-testid="text-app-description" data-agent-id="app-detail-description">{app.description}</p>
                        
                        {app.tags && app.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-auto">
                                {app.tags.map(tag => (
                                    <span key={tag} className="bg-neon-blue/10 text-neon-blue px-2.5 py-1 rounded-sm text-xs font-bold border border-neon-blue/30">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ReadinessScan
              app={app}
              isOwner={!authLoading && user?.uid === app.ownerId}
              rescanState={rescanState}
              onRescan={!authLoading && user?.uid === app.ownerId ? handleRescan : undefined}
            />
            <BadgeEmbed appId={app.id} isOwner={user?.uid === app.ownerId} />

            <ReportForm appId={app.id} appName={app.name} appUrl={app.appUrl} userId={user?.uid} />
            {docId && (
              <ReviewSection appId={docId} user={user} onReviewSubmit={handleReviewSubmit} />
            )}
        </main>
        
        <SiteFooter />
    </div>
  );
}
