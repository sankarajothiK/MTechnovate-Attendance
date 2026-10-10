import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getFirestoreDb();
    if (!db) {
      return NextResponse.json({
        healthy: false,
        status: 'not_initialized',
        message: 'Firestore could not be initialized.',
      });
    }

    // Try a lightweight read
    const q = query(collection(db, 'employees'), limit(1));
    await getDocs(q);

    return NextResponse.json({
      healthy: true,
      status: 'healthy',
      message: 'Cloud Firestore is fully operational and accepting reads and writes.',
    });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    const isPermissionDenied =
      err.code === 'permission-denied' ||
      (err.message && err.message.toLowerCase().includes('permission'));

    return NextResponse.json({
      healthy: false,
      status: isPermissionDenied ? 'permission_denied' : 'error',
      code: err.code || 'unknown',
      message: isPermissionDenied
        ? 'Firebase Cloud Firestore security rules have expired or are denying access.'
        : err.message || 'Unknown database error',
      suggestedRule: `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`,
    });
  }
}
