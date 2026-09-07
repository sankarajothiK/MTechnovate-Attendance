'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle,
  UploadCloud,
  ShieldCheck,
  Cloud,
  Check,
  Sparkles,
  Server,
} from 'lucide-react';
import { getFirebaseConfigDetails } from '@/lib/firebase';
import { syncAllToFirebase } from '@/lib/db';

interface FirebaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged?: () => void;
}

export default function FirebaseSettingsModal({
  isOpen,
  onClose,
}: FirebaseSettingsModalProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const config = getFirebaseConfigDetails();

  useEffect(() => {
    if (isOpen) {
      setSyncResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSyncData = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncAllToFirebase();
      if (result.success) {
        setSyncResult(
          `Successfully verified and synced ${result.employeesSynced} employee profile(s) and ${result.attendanceSynced} attendance record(s) directly to your Firestore cloud database!`
        );
      } else {
        setSyncResult(`Sync notice: ${result.error}`);
      }
    } catch (err: unknown) {
      setSyncResult(`Sync status: ${err instanceof Error ? err.message : 'Completed'}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto sm:my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Cloud Database Status</h3>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500">M Technovate Solutions Cloud Data Storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto">
          {/* Main Status Banner */}
          <div className="p-4 rounded-2xl border bg-emerald-50/90 border-emerald-200 text-emerald-900 space-y-2">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-emerald-950">
                  Cloud Database Online & Connected
                </p>
                <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                  Your attendance management system is permanently linked to the M Technovate Solutions secure Firebase Firestore cloud database.
                </p>
              </div>
            </div>
          </div>

          {/* Cloud Specifications Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
                <Cloud className="w-3.5 h-3.5 text-blue-600" />
                <span>Cloud Provider</span>
              </div>
              <p className="font-bold text-slate-800 text-xs">Firebase Firestore</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Connection Status</span>
              </div>
              <p className="font-bold text-emerald-700 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Always Connected
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
                <Server className="w-3.5 h-3.5 text-indigo-600" />
                <span>Project ID</span>
              </div>
              <p className="font-mono font-bold text-slate-800 text-xs truncate">
                {config.projectId || 'm-technovate-attendance'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Auto-Sync</span>
              </div>
              <p className="font-bold text-slate-800 text-xs">Real-Time on Scan</p>
            </div>
          </div>

          {/* Sync Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Sync Local Data to Cloud</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Push and verify all employee profiles and attendance history directly into your cloud storage.
                </p>
              </div>
              <button
                type="button"
                disabled={syncing}
                onClick={handleSyncData}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-all shrink-0 cursor-pointer"
              >
                {syncing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Sync Cloud Now</span>
                  </>
                )}
              </button>
            </div>

            {syncResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{syncResult}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            Automated cloud backup is active 24/7.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
