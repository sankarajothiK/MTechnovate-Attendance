'use client';

import React, { useState } from 'react';
import { X, Database, CheckCircle, AlertTriangle, Key, ExternalLink } from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';

interface FirebaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FirebaseSettingsModal({ isOpen, onClose }: FirebaseSettingsModalProps) {
  const isConfigured = isFirebaseConfigured();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Firebase Firestore Integration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-600">
          {/* Status Badge */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isConfigured
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}
          >
            {isConfigured ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold text-sm">
                {isConfigured
                  ? 'Firebase Firestore Connected & Active'
                  : 'Demo Persistence Store Active'}
              </p>
              <p className="mt-1 text-xs opacity-90 leading-relaxed">
                {isConfigured
                  ? 'Your application is directly reading and synchronizing attendance and employees with Firebase Firestore.'
                  : 'The system is running on our high-speed resilient local storage and reactive seed data. All features (auto IDs, photos, QR scans, duplicate checks) are 100% functional!'}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-xs mb-2 uppercase tracking-wide">
              Firestore Collections Used:
            </h4>
            <ul className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px]">
              <li className="text-blue-700">
                📁 <strong>employees</strong> — Stores employee profiles, MT001 auto IDs, photos & department
              </li>
              <li className="text-emerald-700">
                📁 <strong>attendance</strong> — Stores daily check-in, check-out, working hours, and location
              </li>
              <li className="text-purple-700">
                📁 <strong>settings</strong> — Stores office location coordinates & geofence parameters
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-xs mb-1.5 uppercase tracking-wide">
              Connecting Your Firebase Project:
            </h4>
            <p className="text-slate-500 mb-2">
              Add your Firebase credentials to <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">.env.local</code>:
            </p>
            <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
{`NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id`}
            </pre>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
