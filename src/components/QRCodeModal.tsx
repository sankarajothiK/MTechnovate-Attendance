'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import MTechnoLogo from './MTechnoLogo';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  ScanLine,
  Sparkles,
  Lock,
} from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QRCodeModal({ isOpen, onClose }: QRCodeModalProps) {
  const [attendanceUrl, setAttendanceUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Generate QR Code with high resolution
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/attendance`;
      setAttendanceUrl(url);

      QRCode.toDataURL(url, {
        width: 420,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((dataUri) => {
          setQrDataUrl(dataUri);
        })
        .catch((err) => console.error('Failed to generate QR code:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(attendanceUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'M-Technovate-Solutions-Attendance-QR.png';
    a.click();
  };

  return (
    // Click on backdrop closes modal
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto cursor-pointer transition-all"
    >
      {/* Click inside modal does NOT close it */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto cursor-default animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <ScanLine className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Office Entrance Poster & QR Code</h3>
              <p className="text-[11px] text-slate-500">Official Check-In Sign for M Technovate Solutions</p>
            </div>
          </div>

          {/* High-visibility Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs transition-colors border border-slate-200 hover:border-rose-200"
            title="Close (or press Esc)"
          >
            <X className="w-4 h-4" />
            <span>Close (Esc)</span>
          </button>
        </div>

        {/* Modal Body: Scrollable & Printable */}
        <div className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* THE GORGEOUS PRINTABLE POSTER */}
          <div
            id="printable-poster"
            ref={posterRef}
            className="relative bg-gradient-to-b from-slate-900 via-slate-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl border-2 border-slate-800 overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Poster Header */}
            <div className="relative space-y-3">
              {/* Logo in pristine white card */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-2xl p-2 bg-white shadow-xl shadow-blue-500/20 ring-4 ring-white/10 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.png"
                    alt="M Technovate Solutions"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                  M TECHNOVATE <span className="text-cyan-400">SOLUTIONS</span>
                </h1>
                <p className="text-xs font-bold tracking-widest text-cyan-300 uppercase mt-0.5">
                  Innovate at every step
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Official Office Entrance Check-In</span>
              </div>
            </div>

            {/* Ultra-sharp QR Code with Targeting Viewfinder Corners */}
            <div className="relative max-w-[280px] mx-auto p-4 bg-white rounded-3xl shadow-2xl">
              {/* Corner Targeting Brackets */}
              <span className="absolute top-2 left-2 w-5 h-5 border-t-4 border-l-4 border-blue-600 rounded-tl-lg" />
              <span className="absolute top-2 right-2 w-5 h-5 border-t-4 border-r-4 border-blue-600 rounded-tr-lg" />
              <span className="absolute bottom-2 left-2 w-5 h-5 border-b-4 border-l-4 border-blue-600 rounded-bl-lg" />
              <span className="absolute bottom-2 right-2 w-5 h-5 border-b-4 border-r-4 border-blue-600 rounded-br-lg" />

              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="M Technovate Solutions Attendance QR Code"
                  className="w-full h-auto rounded-xl mx-auto"
                />
              ) : (
                <div className="w-60 h-60 flex items-center justify-center bg-slate-100 rounded-xl text-slate-400 text-xs font-semibold animate-pulse">
                  Generating QR Code...
                </div>
              )}
            </div>

            {/* 3 Step Visual Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <p className="font-bold text-xs text-slate-200">Open Camera</p>
                <p className="text-[11px] text-slate-400">
                  Scan QR code with your mobile smartphone
                </p>
              </div>

              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
                <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <p className="font-bold text-xs text-slate-200">Enter MT ID</p>
                <p className="text-[11px] text-slate-400">
                  Enter your registered ID (e.g. <strong className="text-cyan-300">MT001</strong>)
                </p>
              </div>

              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <p className="font-bold text-xs text-slate-200">Verify & Mark</p>
                <p className="text-[11px] text-slate-400">
                  Photo verified & time recorded instantly
                </p>
              </div>
            </div>

            {/* Security Guarantee Footer */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Secure Cloud Timestamping • M Technovate Firebase Platform</span>
            </div>
          </div>

          {/* Quick Actions & URL Bar */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 block">
              Direct Mobile Scanner Web Link:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={attendanceUrl}
                className="flex-1 px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-700 select-all font-semibold"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Poster</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>

            <a
              href="/attendance"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Scanner</span>
            </a>

            {/* Dedicated Close Button at bottom */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors active:scale-95"
            >
              <X className="w-4 h-4" />
              <span>Close Poster</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
