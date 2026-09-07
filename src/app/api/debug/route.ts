import { NextResponse } from 'next/server';
import { DEFAULT_FIREBASE_CONFIG, getFirestoreDb } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getFirestoreDb();
  let snapSize = -1;
  let docIds: string[] = [];
  let errorMsg = '';
  try {
    if (db) {
      const snap = await getDocs(collection(db, 'employees'));
      snapSize = snap.size;
      snap.forEach(d => docIds.push(d.id));
    }
  } catch (e: any) {
    errorMsg = e?.message || String(e);
  }

  return NextResponse.json({
    env_apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'exists' : 'undefined',
    env_projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'undefined',
    default_projectId: DEFAULT_FIREBASE_CONFIG.projectId,
    default_authDomain: DEFAULT_FIREBASE_CONFIG.authDomain,
    firestore_db_initialized: !!db,
    firestore_snapSize: snapSize,
    firestore_docIds: docIds,
    firestore_error: errorMsg,
  });
}
