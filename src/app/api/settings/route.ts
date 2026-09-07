import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { OfficeSettings } from '@/types';
import { INITIAL_SETTINGS } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getFirestoreDb();
    if (!db) {
      return NextResponse.json({ success: true, settings: INITIAL_SETTINGS });
    }
    const snap = await getDoc(doc(db, 'settings', 'office'));
    if (snap.exists()) {
      return NextResponse.json({ success: true, settings: snap.data() });
    }
    return NextResponse.json({ success: true, settings: INITIAL_SETTINGS });
  } catch (error: unknown) {
    console.error('API GET /api/settings error:', error);
    return NextResponse.json({ success: true, settings: INITIAL_SETTINGS });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OfficeSettings;
    const db = getFirestoreDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database not initialized' }, { status: 500 });
    }
    await setDoc(doc(db, 'settings', 'office'), body);
    return NextResponse.json({ success: true, settings: body });
  } catch (error: unknown) {
    console.error('API POST /api/settings error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save settings' },
      { status: 500 }
    );
  }
}
