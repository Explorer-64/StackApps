import { initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestoreDb: Firestore | null = null;
let firebaseStorageRef: FirebaseStorage | null = null;
let configPromise: Promise<FirebaseOptions> | null = null;
let firestoreInitPromise: Promise<Firestore> | null = null;
let storageInitPromise: Promise<FirebaseStorage> | null = null;

const PRODUCTION_HOST_AUTH_DOMAIN: Record<string, string> = {
  "stackapps.app": "stackapps.app",
  "www.stackapps.app": "stackapps.app",
};

function withCustomAuthHost(config: FirebaseOptions): FirebaseOptions {
  if (typeof window === "undefined") return config;
  const custom = PRODUCTION_HOST_AUTH_DOMAIN[window.location.hostname];
  if (custom) {
    return { ...config, authDomain: custom };
  }
  return config;
}

async function fetchFirebaseConfig(): Promise<FirebaseOptions> {
  const envConfig: FirebaseOptions = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  if (envConfig.apiKey && !envConfig.apiKey.startsWith("$")) {
    return withCustomAuthHost(envConfig);
  }

  const response = await fetch("/api/config/firebase");
  if (!response.ok) {
    throw new Error("Failed to fetch Firebase config");
  }
  return withCustomAuthHost(await response.json());
}

async function initializeFirebase(): Promise<void> {
  if (firebaseApp) return;

  if (!configPromise) {
    configPromise = fetchFirebaseConfig();
  }

  const config = await configPromise;
  firebaseApp = initializeApp(config);
  firebaseAuth = getAuth(firebaseApp);
}

export function getFirebaseApp(): FirebaseApp {
  if (!firebaseApp) {
    throw new Error("Firebase not initialized. Call initializeFirebase() first.");
  }
  return firebaseApp;
}

export function getFirebaseAuth(): Auth {
  if (!firebaseAuth) {
    throw new Error("Firebase Auth not initialized. Call initializeFirebase() first.");
  }
  return firebaseAuth;
}

export async function getFirestoreDb(): Promise<Firestore> {
  if (firestoreDb) return firestoreDb;
  if (!firestoreInitPromise) {
    firestoreInitPromise = (async () => {
      await initializeFirebase();
      if (!firebaseApp) {
        throw new Error("Firebase app missing after initialization.");
      }
      const { getFirestore } = await import("firebase/firestore");
      firestoreDb = getFirestore(firebaseApp);
      return firestoreDb;
    })();
  }
  return firestoreInitPromise;
}

export async function getFirebaseStorageRef(): Promise<FirebaseStorage> {
  if (firebaseStorageRef) return firebaseStorageRef;
  if (!storageInitPromise) {
    storageInitPromise = (async () => {
      await initializeFirebase();
      if (!firebaseApp) {
        throw new Error("Firebase app missing after initialization.");
      }
      const { getStorage } = await import("firebase/storage");
      firebaseStorageRef = getStorage(firebaseApp);
      return firebaseStorageRef;
    })();
  }
  return storageInitPromise;
}

export { initializeFirebase };
export { firebaseApp, firebaseAuth, firestoreDb as firestore, firebaseStorageRef as firebaseStorage };
