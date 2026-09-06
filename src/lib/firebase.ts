import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

export interface FirebaseConfigOptions {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const FIREBASE_LOCAL_KEY = 'mtechnovate_firebase_config_v1';

export function getSavedFirebaseConfig(): FirebaseConfigOptions | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(FIREBASE_LOCAL_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading saved Firebase config:', e);
  }
  return null;
}

export function saveFirebaseConfig(config: FirebaseConfigOptions): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FIREBASE_LOCAL_KEY, JSON.stringify(config));
    // Re-initialize
    initFirebase(config);
  } catch (e) {
    console.error('Error saving Firebase config:', e);
  }
}

export function removeSavedFirebaseConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(FIREBASE_LOCAL_KEY);
}

function getActiveConfig(): FirebaseConfigOptions {
  const saved = getSavedFirebaseConfig();
  if (saved) return saved;

  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };
}

export const isFirebaseConfigured = (): boolean => {
  const config = getActiveConfig();
  return Boolean(
    config.apiKey &&
    config.projectId &&
    config.apiKey !== 'demo-api-key' &&
    !config.apiKey.includes('placeholder') &&
    !config.apiKey.includes('your_api_key')
  );
};

export function getFirebaseConfigDetails(): FirebaseConfigOptions {
  return getActiveConfig();
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

export function initFirebase(customConfig?: FirebaseConfigOptions): { app: FirebaseApp | null; db: Firestore | null; error?: string } {
  const config = customConfig || getActiveConfig();

  if (!config.apiKey || !config.projectId) {
    return { app: null, db: null, error: 'Missing API Key or Project ID.' };
  }

  try {
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp(config);
    }
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    return { app, db };
  } catch (error: unknown) {
    console.warn('Firebase initialization error:', error);
    return { app: null, db: null, error: error instanceof Error ? error.message : 'Unknown initialization error' };
  }
}

// Initial boot initialization
if (typeof window !== 'undefined' || process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  if (isFirebaseConfigured()) {
    initFirebase();
  }
}

export { app, db, auth, storage };
