'use client';

import React from 'react';
import Link from 'next/link';
import MTechnoLogo from '@/components/MTechnoLogo';
import {
  QrCode,
  ShieldCheck,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Database,
  ExternalLink,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-blue-950 text-white flex flex-col justify-between">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <MTechnoLogo size="md" variant="light" />
        <div className="flex items-center gap-3">
          <Link
            href="/attendance"
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md active:scale-95 flex items-center gap-1.5"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mark Attendance</span>
          </Link>
          <Link
            href="/login"
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            Admin Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto w-full px-6 py-12 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-400 text-xs font-bold tracking-wide">
          <Sparkles className="w-4 h-4" />
          <span>Next-Gen Corporate Attendance Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
          Modern Attendance Management for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">M Techno</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Office entrance QR code scanning, automated sequential employee IDs, photo facial verification, duplicate check-in / check-out protection, and live admin analytics.
        </p>

        {/* Dual Primary Flow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-6 text-left">
          {/* Employee Terminal Flow */}
          <Link
            href="/attendance"
            className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-3xl p-6 sm:p-8 transition-all hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-cyan-400">
                <QrCode className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                  Step 1 • Office Entrance
                </span>
                <h3 className="text-xl font-black text-white mt-1 group-hover:text-cyan-300 transition-colors">
                  Employee Attendance Terminal
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  The mobile-friendly terminal opened after scanning the office QR code. Enter MT ID to verify registered photo and mark attendance instantly.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-cyan-400">
              <span>Open Scanner Terminal</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Admin Management Flow */}
          <Link
            href="/admin"
            className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 sm:p-8 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                  Management & Analytics
                </span>
                <h3 className="text-xl font-black text-white mt-1 group-hover:text-indigo-300 transition-colors">
                  Admin Dashboard
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Auto-generate sequential MT IDs, upload employee photos, monitor today&apos;s attendance, print entrance QR posters, and export CSV reports.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-400">
              <span>Open Admin Dashboard</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 text-left text-xs">
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-1">
            <Users className="w-4 h-4 text-blue-400" />
            <p className="font-bold text-white">Auto Sequential IDs</p>
            <p className="text-[11px] text-slate-500">MT001, MT002 with zero manual typing or duplicates</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <p className="font-bold text-white">Registered Photo Face</p>
            <p className="text-[11px] text-slate-500">Displays employee profile photo directly from DB</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-1">
            <Clock className="w-4 h-4 text-amber-400" />
            <p className="font-bold text-white">Check-In & Check-Out</p>
            <p className="text-[11px] text-slate-500">Duplicate protection & automatic total working hours</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-1">
            <Database className="w-4 h-4 text-cyan-400" />
            <p className="font-bold text-white">Firebase Firestore</p>
            <p className="text-[11px] text-slate-500">Cloud database with seamless dual-mode fallback</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>© 2026 M Techno. All rights reserved.</p>
        <p className="font-mono text-[11px] text-slate-400">
          Admin Demo: <span className="text-blue-400">admin@mtechno.com</span> / <span className="text-blue-400">admin123</span>
        </p>
      </footer>
    </div>
  );
}
