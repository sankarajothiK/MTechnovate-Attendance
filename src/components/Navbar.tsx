'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import MTechnoLogo from './MTechnoLogo';
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/admin" className="focus:outline-none">
              <MTechnoLogo size="md" variant="dark" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Direct Attendance Web Page Shortcut */}
            <Link
              href="/attendance"
              target="_blank"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-semibold transition-all shadow-2xs"
              title="Open Mobile Attendance Scanner in new tab"
            >
              <span>Employee Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
            </Link>

            {/* Office Entrance QR Code Trigger */}
            {onOpenQRModal && (
              <button
                type="button"
                onClick={onOpenQRModal}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
              >
                <QrCode className="w-4 h-4" />
                <span>Office QR Code</span>
              </button>
            )}

            {/* Firebase Status Badge */}
            <button
              type="button"
              onClick={onOpenFirebaseModal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                firebaseActive
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
              }`}
              title="Click to view Firebase connection details"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{firebaseActive ? 'Firebase Live' : 'Demo DB Mode'}</span>
            </button>

            {/* Admin User info & Logout */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <div className="text-left leading-tight hidden xl:block">
                  <p className="text-xs font-semibold text-slate-900">Admin</p>
                  <p className="text-[10px] text-slate-500">M Techno</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Sign out of Admin Dashboard"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            {onOpenQRModal && (
              <button
                type="button"
                onClick={onOpenQRModal}
                className="p-2 rounded-lg text-blue-600 bg-blue-50"
              >
                <QrCode className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/attendance"
              target="_blank"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg"
            >
              <ExternalLink className="w-4 h-4" />
              Open Mobile Attendance Scanner
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-rose-600 bg-rose-50 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
