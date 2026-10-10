import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminDb: Firestore | null = null;
let adminInitialized = false;

export function getAdminFirestore(): Firestore | null {
  if (adminDb) return adminDb;
  if (adminInitialized) return null;

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'm-technovate-attendance';

    const existingApps = getApps();
    if (existingApps.length > 0 && existingApps[0]) {
      adminDb = getFirestore(existingApps[0]);
      return adminDb;
    }

    if (serviceAccountJson) {
      try {
        const parsed = JSON.parse(serviceAccountJson);
        const app = initializeApp(
          {
            credential: cert(parsed),
            projectId,
          },
          'admin-app'
        );
        adminDb = getFirestore(app);
        adminInitialized = true;
        return adminDb;
      } catch (err) {
        console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', err);
      }
    }

    if (clientEmail && privateKey) {
      const app = initializeApp(
        {
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          projectId,
        },
        'admin-app'
      );
      adminDb = getFirestore(app);
      adminInitialized = true;
      return adminDb;
    }

    adminInitialized = true;
    return null;
  } catch (err) {
    console.warn('Firebase Admin SDK initialization skipped or failed:', err);
    adminInitialized = true;
    return null;
  }
}
