'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import QRCodeModal from '@/components/QRCodeModal';
import FirebaseSettingsModal from '@/components/FirebaseSettingsModal';
import {
  Sliders,
  MapPin,
  Clock,
  Building,
  Save,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Navigation,
  Shield,
} from 'lucide-react';
import { getOfficeSettings, updateOfficeSettings } from '@/lib/db';
import { OfficeSettings } from '@/types';
import { getStoredAdmin } from '@/lib/auth';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  const [settings, setSettings] = useState<OfficeSettings>({
    officeName: 'M Techno Headquarters',
    officeAddress: 'Tech Hub Park, Tower 4, Cyber City',
    geofenceEnabled: false,
    latitude: 12.9716,
    longitude: 77.5946,
    radiusMeters: 150,
    workStartTime: '09:30 AM',
    workEndTime: '06:00 PM',
  });

  useEffect(() => {
    if (!getStoredAdmin()) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    getOfficeSettings()
      .then((s) => {
        setSettings(s);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleGetCurrentCoords = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSettings((prev) => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
        }));
        setSuccessMsg('Office coordinates updated from your current GPS position!');
        setTimeout(() => setSuccessMsg(''), 3000);
      },
      (err) => {
        setErrorMsg('Unable to retrieve location: ' + err.message);
        setTimeout(() => setErrorMsg(''), 4000);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const updated = await updateOfficeSettings(settings);
      setSettings(updated);
      setSuccessMsg('Settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        onOpenQRModal={() => setIsQRModalOpen(true)}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Office & Attendance Settings
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure office GPS coordinates, geofence radius, and work shift times
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-semibold shadow-xs">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 font-semibold shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Office Information */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Office Identification</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold uppercase tracking-wider mb-1.5">
                  Company / Office Name
                </label>
                <input
                  type="text"
                  required
                  value={settings.officeName}
                  onChange={(e) => setSettings({ ...settings, officeName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold uppercase tracking-wider mb-1.5">
                  Office Address
                </label>
                <input
                  type="text"
                  required
                  value={settings.officeAddress}
                  onChange={(e) => setSettings({ ...settings, officeAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Optional Geofence & Location Security */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Geofence Location Security (Optional)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify employee GPS coordinates to prevent marking attendance outside the office
                </p>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0 self-start sm:self-center">
                <input
                  type="checkbox"
                  checked={settings.geofenceEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, geofenceEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900">
              <p className="font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                Current Status:{' '}
                {settings.geofenceEnabled ? (
                  <span className="text-emerald-700 font-bold">Enabled (GPS Verification Active)</span>
                ) : (
                  <span className="text-slate-600 font-bold">Disabled (Attendance Allowed from Any Location)</span>
                )}
              </p>
              <p className="mt-1 text-slate-600">
                When enabled, the employee&apos;s phone must be within the specified radius of the office coordinates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
              <div>
                <label className="block text-slate-600 font-bold uppercase tracking-wider mb-1.5">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={settings.latitude}
                  onChange={(e) =>
                    setSettings({ ...settings, latitude: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold uppercase tracking-wider mb-1.5">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={settings.longitude}
                  onChange={(e) =>
                    setSettings({ ...settings, longitude: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold uppercase tracking-wider mb-1.5">
                  Allowed Radius (Meters)
                </label>
                <input
                  type="number"
                  min="20"
                  max="5000"
                  value={settings.radiusMeters}
                  onChange={(e) =>
                    setSettings({ ...settings, radiusMeters: parseInt(e.target.value, 10) || 100 })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleGetCurrentCoords}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span>Calibrate Using My Current GPS Coordinates</span>
              </button>
            </div>
          </div>

          {/* Section 3: Shift Times & Late Threshold */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Shift Timing & Late Arrival Rules</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold uppercase tracking-wider mb-1.5">
                  Shift Start Time (Late Threshold)
                </label>
                <input
                  type="text"
                  placeholder="09:30 AM"
                  value={settings.workStartTime}
                  onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Employees checking in after this time will be tagged as &quot;Late&quot;.
                </p>
              </div>

              <div>
                <label className="block text-slate-600 font-bold uppercase tracking-wider mb-1.5">
                  Shift End Time
                </label>
                <input
                  type="text"
                  placeholder="06:00 PM"
                  value={settings.workEndTime}
                  onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex sm:justify-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </main>

      <QRCodeModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />
      <FirebaseSettingsModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
    </div>
  );
}
