'use client';

import React from 'react';
import Link from 'next/link';
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
  Lock,
  ChevronRight,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdfbfb] via-[#fff8f8] to-[#fbf2f2] text-slate-900 flex flex-col justify-between relative overflow-hidden">
      {/* Top Rose Gold Luminous Accent Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#e8c3b9] via-[#c5838d] via-[#b76e79] to-[#d49b9b]" />

      {/* Ambient Soft Rose Gold Illumination */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-200/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-40 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-3.5 sm:py-5 flex items-center justify-between gap-2.5 sm:gap-4 relative z-10 border-b border-[#ebdcdc]">
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3.5 group select-none shrink-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl p-0.5 sm:p-1 bg-white ring-2 ring-[#ebdcdc] group-hover:ring-[#b76e79] shadow-xs transition-all overflow-hidden flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="M Technovate Solutions"
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            <div className="leading-tight">
              <span className="text-xs sm:text-base font-black tracking-tight text-slate-900 group-hover:text-[#9e5762] transition-colors">
                M TECHNOVATE{' '}
                <span className="bg-gradient-to-r from-[#b76e79] via-[#c5838d] to-[#9e5762] bg-clip-text text-transparent">
                  SOLUTIONS
                </span>
              </span>
            </div>
            <p className="text-[8px] sm:text-[10px] font-semibold tracking-wider text-[#a0636d] uppercase mt-0.5">
              Innovate at every step
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/attendance"
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#b76e79] via-[#c5838d] to-[#9e5762] hover:from-[#a8606b] hover:to-[#8c4651] text-white text-[11px] sm:text-xs font-bold tracking-wide shadow-md shadow-[#b76e79]/20 active:scale-95 transition-all whitespace-nowrap"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Mark Attendance</span>
            <span className="xs:hidden">Attendance</span>
          </Link>
          <Link
            href="/login"
            className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white hover:bg-[#fff7f7] text-[#8e4a55] border border-[#ebdcdc] hover:border-[#b76e79] text-[11px] sm:text-xs font-bold transition-all shadow-2xs whitespace-nowrap"
          >
            Admin
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto w-full px-6 py-12 sm:py-16 text-center space-y-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fff5f5] border border-[#ecd2cf] text-[#8e4a55] text-xs font-bold tracking-wide shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#b76e79]" />
          <span>Official Corporate Attendance Portal</span>
        </div>

        {/* Floating Logo Badge */}
        <div className="flex justify-center my-2">
          <div className="w-28 h-28 rounded-3xl p-2 bg-white shadow-xl shadow-[#b76e79]/15 ring-4 ring-white border border-[#ebdcdc] flex items-center justify-center transform hover:scale-105 transition-transform">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="M Technovate Solutions"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
            M TECHNOVATE{' '}
            <span className="bg-gradient-to-r from-[#b76e79] via-[#c5838d] to-[#9e5762] bg-clip-text text-transparent">
              SOLUTIONS
            </span>
          </h1>
          <p className="text-sm sm:text-base font-bold tracking-widest text-[#a0636d] uppercase">
            Innovate at every step
          </p>
        </div>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Office entrance QR code scanning, automated sequential employee IDs, photo facial verification, duplicate check-in / check-out protection, and live Firebase cloud storage.
        </p>

        {/* Dual Primary Flow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-4 text-left">
          {/* Employee Terminal Flow */}
          <Link
            href="/attendance"
            className="group relative bg-white hover:bg-gradient-to-br hover:from-white hover:to-[#fff9f9] border border-[#ebdcdc] hover:border-[#b76e79] rounded-3xl p-6 sm:p-8 transition-all hover:shadow-xl hover:shadow-[#b76e79]/15 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#fff5f5] to-[#fae8e8] border border-[#ecd2cf] flex items-center justify-center text-[#b76e79] shadow-xs">
                <QrCode className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#a0636d]">
                  Step 1 • Office Entrance
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1 group-hover:text-[#9e5762] transition-colors">
                  Employee Attendance Terminal
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  The mobile-friendly terminal opened after scanning the office QR code. Enter MT ID to verify registered photo and mark attendance instantly.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#f2e6e6] flex items-center justify-between text-xs font-bold text-[#8e4a55] group-hover:text-[#b76e79]">
              <span>Open Scanner Terminal</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Admin Management Flow */}
          <Link
            href="/admin"
            className="group relative bg-white hover:bg-gradient-to-br hover:from-white hover:to-[#fff9f9] border border-[#ebdcdc] hover:border-[#b76e79] rounded-3xl p-6 sm:p-8 transition-all hover:shadow-xl hover:shadow-[#b76e79]/15 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#fff5f5] to-[#fae8e8] border border-[#ecd2cf] flex items-center justify-center text-[#b76e79] shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#a0636d]">
                  Management & Reporting
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1 group-hover:text-[#9e5762] transition-colors">
                  Admin Dashboard
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Auto-generate sequential MT IDs, upload employee photos, monitor today&apos;s attendance, print entrance QR posters, and export CSV reports.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#f2e6e6] flex items-center justify-between text-xs font-bold text-[#8e4a55] group-hover:text-[#b76e79]">
              <span>Open Admin Dashboard</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto pt-6 text-left text-xs">
          <div className="p-4 rounded-2xl bg-white border border-[#ebdcdc] shadow-xs space-y-1">
            <Users className="w-4 h-4 text-[#b76e79]" />
            <p className="font-bold text-slate-900">Sequential MT IDs</p>
            <p className="text-[11px] text-slate-500">Auto MT001, MT002 with zero duplicate IDs</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#ebdcdc] shadow-xs space-y-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <p className="font-bold text-slate-900">Registered Face Photo</p>
            <p className="text-[11px] text-slate-500">Verified employee profile displayed on check-in</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#ebdcdc] shadow-xs space-y-1">
            <Clock className="w-4 h-4 text-[#b76e79]" />
            <p className="font-bold text-slate-900">Check-In & Check-Out</p>
            <p className="text-[11px] text-slate-500">Duplicate protection & automatic total hours</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#ebdcdc] shadow-xs space-y-1">
            <Database className="w-4 h-4 text-cyan-600" />
            <p className="font-bold text-slate-900">Firebase Firestore</p>
            <p className="text-[11px] text-slate-500">Live cloud database with instant synchronization</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 border-t border-[#ebdcdc] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2.5 relative z-10 text-center sm:text-left">
        <p className="font-semibold text-[#8e4a55]">
          © 2026 M Technovate Solutions. All rights reserved. • Innovate at every step
        </p>
        <p className="inline-flex items-center gap-1.5 font-medium text-[11px] text-[#8e4a55] bg-white px-3 py-1 rounded-full border border-[#ebdcdc]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#b76e79]" />
          <span>Secure Enterprise Cloud Portal</span>
        </p>
      </footer>
    </div>
  );
}
