import { initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestoreDb: Firestore | null = null;
let firebaseStorageRef: FirebaseStorage | null = null;
let configPromise: Promise<FirebaseOptions> | null = null;

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
  firestoreDb = getFirestore(firebaseApp);
  firebaseStorageRef = getStorage(firebaseApp);
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

export function getFirestoreDb(): Firestore {
  if (!firestoreDb) {
    throw new Error("Firestore not initialized. Call initializeFirebase() first.");
  }
  return firestoreDb;
}

export function getFirebaseStorageRef(): FirebaseStorage {
  if (!firebaseStorageRef) {
    throw new Error("Firebase Storage not initialized. Call initializeFirebase() first.");
  }
  return firebaseStorageRef;
}

export { initializeFirebase };
export { firebaseApp, firebaseAuth, firestoreDb as firestore, firebaseStorageRef as firebaseStorage };
