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
  ShieldCheck,
  Database,
  Menu,
  X,
  Sparkles,
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
    { href: '/admin/attendance', label: 'Attendance History', icon: CalendarCheck },
    { href: '/admin/settings', label: 'Office Settings', icon: Sliders },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#ebdcdc] shadow-[0_4px_25px_-4px_rgba(183,110,121,0.1)] transition-all">
      {/* Top Rose Gold Luminous Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#e8c3b9] via-[#c5838d] via-[#b76e79] to-[#d49b9b]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-3 group focus:outline-none select-none">
              {/* Official Logo Badge with Rose Gold Ring */}
              <div className="w-10 h-10 rounded-xl p-0.5 bg-white ring-2 ring-[#e8d5d5] group-hover:ring-[#b76e79] shadow-xs transition-all overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="M Technovate Solutions"
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <div className="leading-tight">
                  <span className="text-base font-black tracking-tight text-slate-900 group-hover:text-[#9e5762] transition-colors">
                    M TECHNOVATE{' '}
                    <span className="bg-gradient-to-r from-[#b76e79] via-[#c5838d] to-[#9e5762] bg-clip-text text-transparent font-black">
                      SOLUTIONS
                    </span>
                  </span>
                </div>
                <p className="text-[10px] font-semibold tracking-wider text-[#a0636d] uppercase">
                  Innovate at every step
                </p>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-1.5 ml-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#fff5f5] via-[#fdf1f1] to-[#fae8e8] text-[#8e4a55] border border-[#ecd2cf] shadow-xs'
                        : 'text-slate-600 hover:text-[#9e5762] hover:bg-[#fbf5f5]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-[#b76e79]' : 'text-slate-400 group-hover:text-[#b76e79]'
                      }`}
                    />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Direct Attendance Portal Link */}
            <Link
              href="/attendance"
              target="_blank"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#e8d5d5] hover:border-[#b76e79] text-[#7d3c47] hover:text-[#9e5762] hover:bg-[#fff7f7] text-xs font-bold transition-all shadow-2xs"
              title="Open Mobile Attendance Scanner"
            >
              <span>Employee Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#b76e79]" />
            </Link>

            {/* Rose Gold Office QR Code Button */}
            {onOpenQRModal && (
              <button
                type="button"
                onClick={onOpenQRModal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#b76e79] via-[#c5838d] to-[#9e5762] hover:from-[#a8606b] hover:to-[#8c4651] active:scale-95 text-white text-xs font-black tracking-wide shadow-md shadow-[#b76e79]/25 border border-[#e5b3b9] transition-all"
              >
                <QrCode className="w-4 h-4 text-white" />
                <span>Office QR Poster</span>
              </button>
            )}

            {/* Firebase Live Badge */}
            <button
              type="button"
              onClick={onOpenFirebaseModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                firebaseActive
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 hover:bg-emerald-100 shadow-2xs'
                  : 'bg-[#fff5f5] border-[#ecd2cf] text-[#8e4a55] hover:bg-[#fae8e8]'
              }`}
              title="Firebase Cloud Database Status"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>{firebaseActive ? 'Firebase Live' : 'Demo DB Mode'}</span>
            </button>

            {/* Admin Avatar & Logout */}
            <div className="flex items-center gap-3 pl-3 border-l border-[#ecdcdc]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c5838d] via-[#b76e79] to-[#8e4a55] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#f3e3e3] shadow-xs">
                  A
                </div>
                <div className="text-left leading-tight hidden xl:block">
                  <p className="text-xs font-bold text-slate-900">Admin</p>
                  <p className="text-[10px] text-[#a0636d] font-semibold">M Technovate</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Navigation Trigger */}
          <div className="flex items-center gap-2 md:hidden">
            {onOpenQRModal && (
              <button
                type="button"
                onClick={onOpenQRModal}
                className="p-2 rounded-xl text-white bg-gradient-to-r from-[#b76e79] to-[#9e5762] shadow-xs"
              >
                <QrCode className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-[#fff5f5] hover:text-[#9e5762] transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#ebdcdc] bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                  isActive
                    ? 'bg-gradient-to-r from-[#fff5f5] to-[#fdf1f1] text-[#8e4a55] border border-[#ecd2cf]'
                    : 'text-slate-700 hover:bg-[#faf4f4] hover:text-[#9e5762]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#b76e79]' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <div className="pt-3 border-t border-[#ebdcdc] flex flex-col gap-2">
            <Link
              href="/attendance"
              target="_blank"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-[#8e4a55] bg-[#fff5f5] border border-[#ecd2cf] rounded-xl"
            >
              <ExternalLink className="w-4 h-4 text-[#b76e79]" />
              <span>Open Mobile Attendance Scanner</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 rounded-xl"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
