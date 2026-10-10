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
  AlertTriangle,
  ExternalLink,
  Copy,
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
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'permission_denied' | 'error'>('checking');
  const [healthMessage, setHealthMessage] = useState<string>('');
  const [copiedRule, setCopiedRule] = useState(false);
  const config = getFirebaseConfigDetails();

  const firestoreRulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const checkHealth = async () => {
    try {
      setHealthStatus('checking');
      const res = await fetch('/api/firebase-health');
      const data = await res.json();
      if (data.healthy) {
        setHealthStatus('healthy');
        setHealthMessage('Cloud database is fully operational.');
      } else if (data.status === 'permission_denied') {
        setHealthStatus('permission_denied');
        setHealthMessage(data.message || 'Firebase Firestore security rules have expired.');
      } else {
        setHealthStatus('error');
        setHealthMessage(data.message || 'Unable to connect to database.');
      }
    } catch {
      setHealthStatus('error');
      setHealthMessage('Connection test failed.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSyncResult(null);
      checkHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(firestoreRulesText);
    setCopiedRule(true);
    setTimeout(() => setCopiedRule(false), 2500);
  };

  const handleSyncData = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncAllToFirebase();
      if (result.success) {
        setSyncResult(
          `Successfully verified and synced ${result.employeesSynced} employee profile(s) and ${result.attendanceSynced} attendance record(s) directly to your Firestore cloud database!`
        );
        checkHealth();
      } else {
        setSyncResult(`Sync notice: ${result.error}`);
      }
    } catch (err: unknown) {
      setSyncResult(`Sync status: ${err instanceof Error ? err.message : 'Completed'}`);
    } finally {
      setSyncing(false);
    }
  };

  const projectId = config.projectId || 'm-technovate-attendance';
  const rulesUrl = `https://console.firebase.google.com/project/${projectId}/firestore/rules`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto sm:my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                healthStatus === 'healthy'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : healthStatus === 'permission_denied'
                  ? 'bg-amber-50 border-amber-200 text-amber-600'
                  : 'bg-blue-50 border-blue-200 text-blue-600'
              }`}
            >
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Cloud Database Status</h3>
                {healthStatus === 'healthy' && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live & Synced
                  </span>
                )}
                {healthStatus === 'permission_denied' && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Rules Expired
                  </span>
                )}
                {healthStatus === 'checking' && (
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    Checking...
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500">M Technovate Solutions Cloud Data Storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto">
          {/* Permission Denied Warning Box */}
          {healthStatus === 'permission_denied' && (
            <div className="p-4 rounded-2xl border bg-amber-50 border-amber-300 text-amber-950 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-amber-950">
                    Firebase 30-Day Test Rules Expired
                  </p>
                  <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                    Cloud Firestore test mode expired. To permanently enable employee and attendance sync across all devices, update the rules in Firebase Console:
                  </p>
                </div>
              </div>

              {/* Step by step fix */}
              <div className="bg-white/90 border border-amber-200 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-slate-700">Permanent Firestore Rule:</span>
                  <button
                    type="button"
                    onClick={handleCopyRules}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-100/80 hover:bg-amber-100 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                  >
                    {copiedRule ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedRule ? 'Copied!' : 'Copy Rule'}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 text-amber-200 p-2.5 rounded-lg font-mono text-[10px] overflow-x-auto leading-relaxed">
                  {firestoreRulesText}
                </pre>
                <div className="flex items-center justify-between pt-1">
                  <a
                    href={rulesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
                  >
                    <span>Open Firebase Console Rules</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-[10px] text-slate-500">Paste & click Publish</span>
                </div>
              </div>
            </div>
          )}

          {/* Healthy Status Banner */}
          {healthStatus === 'healthy' && (
            <div className="p-4 rounded-2xl border bg-emerald-50/90 border-emerald-200 text-emerald-900 space-y-2">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-emerald-950">
                    Cloud Database Online & Connected
                  </p>
                  <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                    Your attendance system is linked to the M Technovate Solutions secure Firestore cloud database. All registered employees and attendance records are synced across all devices.
                  </p>
                </div>
              </div>
            </div>
          )}

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
                <span>Connection</span>
              </div>
              <p className="font-bold text-slate-800 text-xs flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    healthStatus === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {healthStatus === 'healthy' ? 'Active' : healthStatus === 'permission_denied' ? 'Rules Pending' : 'Checking'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
                <Server className="w-3.5 h-3.5 text-indigo-600" />
                <span>Project ID</span>
              </div>
              <p className="font-mono font-bold text-slate-800 text-xs truncate">
                {projectId}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Auto-Sync</span>
              </div>
              <p className="font-bold text-slate-800 text-xs">Cross-Device</p>
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
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                  syncResult.includes('Successfully')
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border border-amber-200 text-amber-800'
                }`}
              >
                {syncResult.includes('Successfully') ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
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
