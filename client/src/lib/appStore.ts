import { create } from 'zustand';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDoc,
  query,
  where,
  limit,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
  type Firestore
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import type { App } from '@shared/schema';

interface AppState {
  publicApps: App[];
  myApps: App[];
  adminApps: App[];
  isLoading: boolean;
  error: string | null;
  subscribeToPublicApps: () => Unsubscribe;
  subscribeToMyApps: (userId: string) => Unsubscribe;
  subscribeToAllApps: () => Unsubscribe;
  addApp: (app: Omit<App, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateApp: (id: string, app: Partial<Omit<App, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteApp: (id: string) => Promise<void>;
}

const convertTimestamp = (timestamp: any): string => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp || new Date().toISOString();
};

const mapDocToApp = (doc: any): App => {
  const data = doc.data();
  return {
    id: doc.id,
    ownerId: data.ownerId || '',
    name: data.name || '',
    description: data.description || '',
    thumbnailUrl: data.thumbnailUrl || '',
    appUrl: data.appUrl || '',
    category: data.category,
    tags: data.tags || [],
    status: data.status,
    moderationStatus: data.moderationStatus || 'pending_review',
    rejectionReason: data.rejectionReason,
    isFeatured: data.isFeatured || false,
    averageRating: data.averageRating,
    ratingCount: data.ratingCount,
    notes: data.notes,
    quickLinks: data.quickLinks,
    marketing: data.marketing,
    submissions: data.submissions || {},
    strategyLogs: data.strategyLogs || [],
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    submittedAt: data.submittedAt ? convertTimestamp(data.submittedAt) : undefined,
    scan_reachable: data.scan_reachable,
    scan_llms: data.scan_llms,
    scan_robots: data.scan_robots,
    scan_sitemap: data.scan_sitemap,
    scan_faq: data.scan_faq,
    scan_blueprint: data.scan_blueprint,
    scan_mcp: data.scan_mcp,
    scan_cli: data.scan_cli,
    scan_pwa_android: data.scan_pwa_android,
    scan_pwa_ios: data.scan_pwa_ios,
    scan_pwa_sw: data.scan_pwa_sw,
    scan_viewport: data.scan_viewport,
    scan_safety_verified: data.scan_safety_verified,
    scan_lab_llms_full: data.scan_lab_llms_full,
    scan_lab_openapi: data.scan_lab_openapi,
    scan_lab_webmcp: data.scan_lab_webmcp,
    scan_lab_ap2_ucp_hint: data.scan_lab_ap2_ucp_hint,
    scan_lab_verifiable_intent_hint: data.scan_lab_verifiable_intent_hint,
    scan_score: data.scan_score,
    scan_timestamp: data.scan_timestamp ? convertTimestamp(data.scan_timestamp) : undefined,
    scan_public: data.scan_public,
  };
};

let firestoreRef: Firestore | null = null;

async function getDb(): Promise<Firestore> {
  if (!firestoreRef) {
    firestoreRef = await getFirestoreDb();
  }
  return firestoreRef;
}

export const useAppStore = create<AppState>((set) => ({
  publicApps: [],
  myApps: [],
  adminApps: [],
  isLoading: true,
  error: null,

  subscribeToPublicApps: () => {
    set({ isLoading: true });

    let active = true;
    let firestoreUnsub: Unsubscribe = () => {};

    getDb().then((db) => {
      if (!active) return;
      const appsCollection = collection(db, 'apps');
      const q = query(
        appsCollection,
        where('moderationStatus', '==', 'approved'),
        limit(50)
      );

      firestoreUnsub = onSnapshot(
        q,
        (snapshot) => {
          if (!active) return;
          const publicApps = snapshot.docs.map(mapDocToApp);
          set({ publicApps, isLoading: false });
        },
        (error) => {
          console.error('Error fetching public apps:', error);
          if (!active) return;
          set({ error: 'Failed to load public apps', isLoading: false });
        }
      );
    }).catch((error) => {
      console.error('Failed to initialize Firestore:', error);
      if (!active) return;
      set({ error: 'Failed to connect to database', isLoading: false });
    });

    return () => {
      active = false;
      firestoreUnsub();
    };
  },

  subscribeToMyApps: (userId: string) => {
    set({ isLoading: true, myApps: [] });

    let active = true;
    let firestoreUnsub: Unsubscribe = () => {};

    getDb().then((db) => {
      if (!active) return;
      const appsCollection = collection(db, 'apps');
      const q = query(appsCollection, where('ownerId', '==', userId));

      firestoreUnsub = onSnapshot(
        q,
        (snapshot) => {
          if (!active) return;
          const myApps = snapshot.docs.map(mapDocToApp);
          set({ myApps, isLoading: false });
        },
        (error) => {
          console.error('Error fetching my apps:', error);
          if (!active) return;
          set({ error: 'Failed to load your apps', isLoading: false });
        }
      );
    }).catch((error) => {
      console.error('Failed to initialize Firestore:', error);
      if (!active) return;
      set({ error: 'Failed to connect to database', isLoading: false });
    });

    return () => {
      active = false;
      firestoreUnsub();
    };
  },

  subscribeToAllApps: () => {
    set({ isLoading: true });

    let active = true;
    let firestoreUnsub: Unsubscribe = () => {};

    getDb().then((db) => {
      if (!active) return;
      const appsCollection = collection(db, 'apps');

      firestoreUnsub = onSnapshot(
        appsCollection,
        (snapshot) => {
          if (!active) return;
          const adminApps = snapshot.docs.map(mapDocToApp);
          set({ adminApps, isLoading: false });
        },
        (error) => {
          console.error('Error fetching all apps:', error);
          if (!active) return;
          set({ error: 'Failed to load all apps', isLoading: false });
        }
      );
    }).catch((error) => {
      console.error('Failed to initialize Firestore:', error);
      if (!active) return;
      set({ error: 'Failed to connect to database', isLoading: false });
    });

    return () => {
      active = false;
      firestoreUnsub();
    };
  },

  addApp: async (appData) => {
    try {
      const db = await getDb();
      const appsCollection = collection(db, 'apps');
      const docRef = await addDoc(appsCollection, {
        ...appData,
        moderationStatus: 'pending_review',
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      (async () => {
        try {
          let hostname: string;
          try {
            hostname = new URL(appData.appUrl).hostname.toLowerCase();
          } catch {
            return;
          }

          const freeScanRef = doc(db, 'free_scans', hostname);
          const freeScan = await getDoc(freeScanRef);

          if (freeScan.exists() && freeScan.data()?.converted !== true) {
            await updateDoc(freeScanRef, {
              converted: true,
              converted_at: new Date().toISOString(),
              app_id: docRef.id,
            });
          }
        } catch {
        }
      })();

      // Fire-and-forget AI moderation — if it fails, app stays as pending_review
      (async () => {
        try {
          const { getFirebaseAuth } = await import('@/lib/firebase');
          const token = await getFirebaseAuth().currentUser?.getIdToken();
          if (token) {
            fetch('/api/moderate-app', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                appId: docRef.id,
                name: appData.name,
                description: appData.description,
                appUrl: appData.appUrl,
                category: appData.category,
                tags: appData.tags,
              }),
            });
          }
        } catch {
          // Moderation failed silently — app stays in pending_review queue
        }
      })();
    } catch (error) {
      console.error('Error adding app:', error);
      set({ error: 'Failed to add app' });
      throw error;
    }
  },

  updateApp: async (id, appData) => {
    try {
      const db = await getDb();
      const appDoc = doc(db, 'apps', id);
      await updateDoc(appDoc, {
        ...appData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating app:', error);
      set({ error: 'Failed to update app' });
      throw error;
    }
  },

  deleteApp: async (id) => {
    try {
      const db = await getDb();
      const appDoc = doc(db, 'apps', id);
      await deleteDoc(appDoc);
    } catch (error) {
      console.error('Error deleting app:', error);
      set({ error: 'Failed to delete app' });
      throw error;
    }
  },
}));
