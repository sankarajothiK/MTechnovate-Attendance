'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle,
  AlertTriangle,
  Key,
  Save,
  RefreshCw,
  UploadCloud,
  Check,
  Trash2,
} from 'lucide-react';
import {
  isFirebaseConfigured,
  getFirebaseConfigDetails,
  saveFirebaseConfig,
  removeSavedFirebaseConfig,
  FirebaseConfigOptions,
} from '@/lib/firebase';
import { syncAllToFirebase } from '@/lib/db';

interface FirebaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged?: () => void;
}

export default function FirebaseSettingsModal({
  isOpen,
  onClose,
  onConfigChanged,
}: FirebaseSettingsModalProps) {
  const [config, setConfig] = useState<FirebaseConfigOptions>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  });
  const [jsonInput, setJsonInput] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [isConfigured, setIsConfigured] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const active = getFirebaseConfigDetails();
      setConfig(active);
      setIsConfigured(isFirebaseConfigured());
      setSyncResult(null);
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleJsonPaste = (text: string) => {
    setJsonInput(text);
    try {
      // Find json-like structure even if wrapped in const firebaseConfig = { ... }
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setConfig({
          apiKey: parsed.apiKey || config.apiKey,
          authDomain: parsed.authDomain || config.authDomain,
          projectId: parsed.projectId || config.projectId,
          storageBucket: parsed.storageBucket || config.storageBucket,
          messagingSenderId: parsed.messagingSenderId || config.messagingSenderId,
          appId: parsed.appId || config.appId,
        });
        setStatusMessage('Parsed configuration successfully from JSON!');
      }
    } catch {
      // Ignore if still typing
    }
  };

  const handleSaveConfig = () => {
    if (!config.apiKey || !config.projectId) {
      alert('Please provide at least the Firebase API Key and Project ID.');
      return;
    }

    saveFirebaseConfig(config);
    setIsConfigured(isFirebaseConfigured());
    setStatusMessage('Firebase configuration saved! Connected to Firestore.');
    if (onConfigChanged) onConfigChanged();
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleDisconnect = () => {
    if (confirm('Disconnect Firebase configuration and revert to local storage mode?')) {
      removeSavedFirebaseConfig();
      setConfig({
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
      });
      setIsConfigured(false);
      setStatusMessage('Disconnected from Firebase. Using local persistence.');
      if (onConfigChanged) onConfigChanged();
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleSyncData = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncAllToFirebase();
      if (result.success) {
        setSyncResult(
          `Successfully synced ${result.employeesSynced} employees and ${result.attendanceSynced} attendance records directly to Firestore!`
        );
      } else {
        setSyncResult(`Sync failed: ${result.error}`);
      }
    } catch (err: unknown) {
      setSyncResult(`Error: ${err instanceof Error ? err.message : 'Failed to sync'}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto sm:my-8 flex flex-col max-h-[92vh]">
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Firebase Firestore Connection</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500">Cloud Data Storage for M Technovate Solutions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto">
          {/* Status Alert Banner */}
          <div
            className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row items-start justify-between gap-3 ${
              isConfigured
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/90 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {isConfigured ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold text-sm">
                  {isConfigured
                    ? `Firebase Firestore Connected (${config.projectId})`
                    : 'Firebase Not Connected — Local Storage Active'}
                </p>
                <p className="mt-1 text-xs opacity-90 leading-relaxed">
                  {isConfigured
                    ? 'All employee profiles, photos, and attendance check-ins are saved directly to your cloud Firestore.'
                    : 'Enter your Firebase Web App credentials below to connect your cloud database.'}
                </p>
              </div>
            </div>

            {isConfigured && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-[11px] font-bold shrink-0 transition-colors"
                title="Disconnect Firebase"
              >
                Disconnect
              </button>
            )}
          </div>

          {statusMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-600" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Sync Button when Connected */}
          {isConfigured && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h4 className="font-bold text-slate-800">Sync Local Data to Firebase</h4>
                  <p className="text-[11px] text-slate-500">
                    Push all existing employees and attendance records to Firestore
                  </p>
                </div>
                <button
                  type="button"
                  disabled={syncing}
                  onClick={handleSyncData}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white rounded-lg font-bold shadow-xs transition-all shrink-0"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>

              {syncResult && (
                <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                  {syncResult}
                </p>
              )}
            </div>
          )}

          {/* Tabs: Form or JSON */}
          <div className="border-b border-slate-200 flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`pb-2 font-bold uppercase tracking-wider text-[11px] border-b-2 transition-colors ${
                activeTab === 'form'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Credentials Form
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('json')}
              className={`pb-2 font-bold uppercase tracking-wider text-[11px] border-b-2 transition-colors ${
                activeTab === 'json'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Paste Firebase Config JSON
            </button>
          </div>

          {activeTab === 'form' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
                  Firebase API Key *
                </label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
                  Project ID *
                </label>
                <input
                  type="text"
                  placeholder="mtechnovate-attendance"
                  value={config.projectId}
                  onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
                  Auth Domain
                </label>
                <input
                  type="text"
                  placeholder="project-id.firebaseapp.com"
                  value={config.authDomain}
                  onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
                  Storage Bucket
                </label>
                <input
                  type="text"
                  placeholder="project-id.appspot.com"
                  value={config.storageBucket}
                  onChange={(e) => setConfig({ ...config, storageBucket: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
                  Messaging Sender ID
                </label>
                <input
                  type="text"
                  placeholder="1234567890"
                  value={config.messagingSenderId}
                  onChange={(e) => setConfig({ ...config, messagingSenderId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
                  App ID
                </label>
                <input
                  type="text"
                  placeholder="1:1234567890:web:abcdef"
                  value={config.appId}
                  onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Paste your firebaseConfig object from Firebase Console:
              </label>
              <textarea
                rows={6}
                value={jsonInput}
                onChange={(e) => handleJsonPaste(e.target.value)}
                placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "...",\n  projectId: "...",\n  storageBucket: "...",\n  messagingSenderId: "...",\n  appId: "..."\n};`}
                className="w-full p-3 bg-slate-900 text-cyan-300 font-mono text-[11px] rounded-xl focus:outline-none"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="shrink-0 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] text-slate-400 order-2 sm:order-1 text-center sm:text-left">
              Settings persist across browser sessions.
            </p>
            <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs active:scale-95 text-center whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save & Connect</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
