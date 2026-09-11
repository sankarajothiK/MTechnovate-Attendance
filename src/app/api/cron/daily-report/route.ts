import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mtechnovate-attendance.vercel.app';
    const res = await fetch(`${baseUrl}/api/attendance/send-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cronTriggered: true,
      reportResult: data,
    });
  } catch (error: unknown) {
    console.error('Cron daily-report error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Cron failed' },
      { status: 500 }
    );
  }
}
