'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  QrCode,
  Users,
  CalendarCheck,
  Sliders,
  LogOut,
  ExternalLink,
  Database,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';
import { getStoredAdmin, logoutAdmin, AdminUser } from '@/lib/auth';

interface NavbarProps {
  onOpenQRModal?: () => void;
  onOpenFirebaseModal?: () => void;
}

export default function Navbar({ onOpenQRModal, onOpenFirebaseModal }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [firebaseActive, setFirebaseActive] = useState(false);

  useEffect(() => {
    setAdmin(getStoredAdmin());
    setFirebaseActive(isFirebaseConfigured());
  }, [pathname]);

  const handleLogout = () => {
    logoutAdmin();
    router.push('/login');
  };

  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: CalendarCheck },
    { href: '/admin/employees', label: 'Employees', icon: Users },
    { href: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
    { href: '/admin/settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#ebdcdc] shadow-[0_4px_20px_-4px_rgba(183,110,121,0.06)]">
      {/* Top Rose Gold Shimmer Line */}
      <div className="h-[2.5px] w-full bg-gradient-to-r from-[#e8c3b9] via-[#c5838d] to-[#d49b9b]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex h-16 sm:h-18 items-center justify-between gap-3 sm:gap-6 lg:gap-8">
          {/* 1. Left: Brand Identity */}
          <Link
            href="/admin"
            className="flex items-center gap-2.5 sm:gap-3.5 group focus:outline-none select-none shrink-0"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl p-0.5 sm:p-1 bg-white ring-2 ring-[#ebdcdc] group-hover:ring-[#c5838d] shadow-xs transition-all overflow-hidden flex items-center justify-center shrink-0">
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

          {/* 2. Middle: Spacious Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 lg:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#fff5f5] text-[#8e4a55] border border-[#ecd2cf] shadow-2xs'
                      : 'text-slate-600 hover:text-[#9e5762] hover:bg-[#faf4f4]'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? 'text-[#b76e79]' : 'text-slate-400'
                    }`}
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* 3. Right: Clean, Uncluttered Action Controls */}
          <div className="hidden lg:flex items-center gap-3.5 shrink-0">
            {/* Cloud Database Status Badge */}
            <button
              type="button"
              onClick={onOpenFirebaseModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-emerald-50/90 border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
              title="Cloud Database: Online & Connected"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-bold">Cloud Connected</span>
            </button>

            {/* Direct Attendance Portal Shortcut */}
            <Link
              href="/attendance"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#9e5762] transition-colors"
              title="Open Scanner Terminal in new tab"
            >
              <span>Scanner</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#b76e79]" />
            </Link>

            {/* Primary Action: Rose Gold Office QR Code */}
            {onOpenQRModal && (
              <button
                type="button"
                onClick={onOpenQRModal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#b76e79] via-[#c5838d] to-[#9e5762] hover:from-[#a8606b] hover:to-[#8c4651] active:scale-95 text-white text-xs font-bold tracking-wide shadow-md shadow-[#b76e79]/20 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Office QR</span>
              </button>
            )}

            {/* Unified Neat Admin User Chip */}
            <div className="flex items-center gap-2 pl-3 border-l border-[#ecdcdc]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c5838d] to-[#8e4a55] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#f3e3e3] shadow-xs">
                A
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Sign out of Admin Dashboard"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Right Controls: QR Trigger & Hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            {onOpenQRModal && (
              <button
                type="button"
                onClick={onOpenQRModal}
                className="p-2 rounded-xl text-white bg-gradient-to-r from-[#b76e79] to-[#9e5762] shadow-xs active:scale-95"
                title="Office QR Poster"
              >
                <QrCode className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-[#fff5f5] hover:text-[#9e5762] transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#ebdcdc] bg-white/98 backdrop-blur-xl px-4 pt-3 pb-5 space-y-2.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#fff5f5] text-[#8e4a55] border border-[#ecd2cf]'
                      : 'text-slate-700 hover:bg-[#faf4f4] hover:text-[#9e5762]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#b76e79]' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Quick Action Buttons */}
          <div className="pt-3 border-t border-[#ebdcdc] space-y-2">
            <Link
              href="/attendance"
              target="_blank"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-[#8e4a55] bg-[#fff5f5] border border-[#ecd2cf] rounded-xl active:scale-98"
            >
              <ExternalLink className="w-4 h-4 text-[#b76e79]" />
              <span>Open Scanner Terminal</span>
            </Link>

            {onOpenFirebaseModal && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenFirebaseModal();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cloud Database Online</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 rounded-xl active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out (Admin)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
