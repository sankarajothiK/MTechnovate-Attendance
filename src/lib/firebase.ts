import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
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

const REAL_FIREBASE_CONFIG: FirebaseConfigOptions = {
  apiKey: 'AIzaSyCfbY_f0eJgOFvtyllSwU4fZW_dSLUPvWU',
  authDomain: 'm-technovate-attendance.firebaseapp.com',
  projectId: 'm-technovate-attendance',
  storageBucket: 'm-technovate-attendance.firebasestorage.app',
  messagingSenderId: '50293975206',
  appId: '1:50293975206:web:a4395d16dbba47b2aeec67',
};

function sanitizeConfigValue(val: string | undefined, fallback: string): string {
  if (!val) return fallback;
  const trimmed = val.trim();
  if (!trimmed || trimmed.includes('your_') || trimmed.includes('placeholder')) {
    return fallback;
  }
  return trimmed;
}

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfigOptions = {
  apiKey: sanitizeConfigValue(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, REAL_FIREBASE_CONFIG.apiKey),
  authDomain: sanitizeConfigValue(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, REAL_FIREBASE_CONFIG.authDomain),
  projectId: sanitizeConfigValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, REAL_FIREBASE_CONFIG.projectId),
  storageBucket: sanitizeConfigValue(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, REAL_FIREBASE_CONFIG.storageBucket),
  messagingSenderId: sanitizeConfigValue(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, REAL_FIREBASE_CONFIG.messagingSenderId),
  appId: sanitizeConfigValue(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, REAL_FIREBASE_CONFIG.appId),
};

const FIREBASE_LOCAL_KEY = 'mtechnovate_firebase_config_v1';

export function getSavedFirebaseConfig(): FirebaseConfigOptions | null {
  if (typeof window === 'undefined') return DEFAULT_FIREBASE_CONFIG;
  try {
    const saved = localStorage.getItem(FIREBASE_LOCAL_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        parsed.apiKey &&
        parsed.projectId &&
        !parsed.projectId.includes('your_') &&
        !parsed.apiKey.includes('your_')
      ) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading saved Firebase config:', e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(config: FirebaseConfigOptions): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FIREBASE_LOCAL_KEY, JSON.stringify(config));
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
  return DEFAULT_FIREBASE_CONFIG;
}

export const isFirebaseConfigured = (): boolean => {
  return true;
};

export function getFirebaseConfigDetails(): FirebaseConfigOptions {
  return DEFAULT_FIREBASE_CONFIG;
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

export function initFirebase(customConfig?: FirebaseConfigOptions): { app: FirebaseApp | null; db: Firestore | null; error?: string } {
  let config = customConfig || getActiveConfig();

  // Guard against placeholder values from accidental dashboard settings
  if (
    !config.projectId ||
    !config.apiKey ||
    config.projectId.includes('your_') ||
    config.apiKey.includes('your_')
  ) {
    config = REAL_FIREBASE_CONFIG;
  }

  try {
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp(config);
    }

    if (!db) {
      try {
        db = initializeFirestore(app, {
          experimentalAutoDetectLongPolling: true,
        });
      } catch {
        db = getFirestore(app);
      }
    }

    try {
      if (!auth) auth = getAuth(app);
    } catch {
      // ignore
    }

    try {
      if (!storage) storage = getStorage(app);
    } catch {
      // ignore
    }

    return { app, db };
  } catch (error: unknown) {
    console.warn('Firebase initialization error:', error);
    return { app: null, db: null, error: error instanceof Error ? error.message : 'Unknown initialization error' };
  }
}

// Initial eager boot initialization
try {
  initFirebase();
} catch (e) {
  console.warn('Initial Firebase init warning:', e);
}

export function getFirestoreDb(): Firestore | null {
  if (!db) {
    const res = initFirebase();
    return res.db;
  }
  return db;
}

export { app, db, auth, storage };
