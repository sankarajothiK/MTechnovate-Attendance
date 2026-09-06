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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/attendance`;
      setAttendanceUrl(url);

      QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
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
    a.download = 'M-Techno-Attendance-QR.png';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <MTechnoLogo size="sm" />
            <span className="text-sm font-semibold text-slate-700 ml-2">
              Office Entrance QR Code
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Printable Poster Preview */}
        <div className="p-6 md:p-8 space-y-6">
          <div
            id="printable-poster"
            ref={posterRef}
            className="bg-white border-2 border-slate-200 rounded-2xl p-6 text-center space-y-4 shadow-xs"
          >
            <div className="flex justify-center mb-1">
              <MTechnoLogo size="lg" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                M Techno Attendance
              </h2>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-0.5">
                Official Office Entrance Check-In & Check-Out
              </p>
            </div>

            {/* Sharp QR Code Display */}
            <div className="flex justify-center p-3 bg-slate-50 rounded-xl border border-slate-100 max-w-[280px] mx-auto">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="M Techno Attendance QR Code"
                  className="w-56 h-56 rounded-lg shadow-2xs"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center bg-slate-200 animate-pulse rounded-lg">
                  Loading QR...
                </div>
              )}
            </div>

            {/* Instruction Steps */}
            <div className="text-left bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 space-y-1.5 text-xs text-blue-950">
              <p className="font-bold flex items-center gap-1.5 text-blue-800">
                <Smartphone className="w-4 h-4 text-blue-600" />
                How to Mark Attendance:
              </p>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-700 pl-1">
                <li>Scan this QR code using your mobile phone camera</li>
                <li>The secure M Techno Attendance portal will open</li>
                <li>Enter your Employee ID (e.g. <span className="font-semibold text-blue-700">MT001</span>)</li>
                <li>Click <strong>Verify & Mark Attendance</strong></li>
              </ol>
            </div>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Office Entrance Security Protected • Server-Timestamped</span>
            </div>
          </div>

          {/* URL & Quick Actions */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 block">
              Attendance Portal URL:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={attendanceUrl}
                className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-700 select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Poster</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download QR</span>
            </button>

            <a
              href="/attendance"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Scanner</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
