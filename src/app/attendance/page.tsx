'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import MTechnoLogo from '@/components/MTechnoLogo';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Building,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  LogOut,
  MapPin,
  Sparkles,
  RefreshCw,
  Search,
} from 'lucide-react';
import { verifyAndMarkAttendance, getOfficeSettings } from '@/lib/db';
import { Employee, AttendanceRecord, OfficeSettings } from '@/types';
import { formatTime12h, formatDisplayDate } from '@/lib/dateUtils';

export default function AttendancePage() {
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [settings, setSettings] = useState<OfficeSettings | null>(null);

  // Result States
  const [statusType, setStatusType] = useState<
    'IDLE' | 'SUCCESS_CHECK_IN' | 'SUCCESS_CHECK_OUT' | 'ALREADY_COMPLETED' | 'NOT_FOUND' | 'INACTIVE' | 'LOCATION_ERROR'
  >('IDLE');
  const [verifiedEmployee, setVerifiedEmployee] = useState<Employee | null>(null);
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(formatTime12h(now));
      setCurrentDate(formatDisplayDate(now));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    getOfficeSettings().then(setSettings);
  }, []);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#06b6d4', '#10b981', '#6366f1'],
      });
    } catch {
      // Confetti fallback
    }
  };

  const handleVerifyAndMark = async (overrideId?: string) => {
    const targetId = (overrideId || employeeId).trim().toUpperCase();
    if (!targetId) {
      setErrorMessage('Please enter your Employee ID (e.g. MT001)');
      setStatusType('NOT_FOUND');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setStatusType('IDLE');
    setVerifiedEmployee(null);
    setAttendanceRecord(null);

    // Geolocation if geofence is enabled
    let coords: { latitude: number; longitude: number } | undefined = undefined;
    if (settings?.geofenceEnabled && navigator.geolocation) {
      try {
        coords = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            (err) => reject(err),
            { timeout: 8000 }
          );
        });
      } catch (locErr) {
        console.warn('Geolocation capture failed or denied:', locErr);
      }
    }

    try {
      const result = await verifyAndMarkAttendance(targetId, coords);

      if (result.success) {
        setVerifiedEmployee(result.employee || null);
        setAttendanceRecord(result.record || null);

        if (result.type === 'CHECK_IN') {
          setStatusType('SUCCESS_CHECK_IN');
          triggerConfetti();
        } else if (result.type === 'CHECK_OUT') {
          setStatusType('SUCCESS_CHECK_OUT');
          triggerConfetti();
        }
      } else {
        if (result.employee) {
          setVerifiedEmployee(result.employee);
        }
        if (result.record) {
          setAttendanceRecord(result.record);
        }

        if (result.type === 'ALREADY_COMPLETED') {
          setStatusType('ALREADY_COMPLETED');
          setErrorMessage(result.message);
        } else if (result.message.includes('inactive')) {
          setStatusType('INACTIVE');
          setErrorMessage(result.message);
        } else if (result.message.includes('Outside Office Location') || result.message.includes('Location verification')) {
          setStatusType('LOCATION_ERROR');
          setErrorMessage(result.message);
        } else {
          setStatusType('NOT_FOUND');
          setErrorMessage(result.message);
        }
      }
    } catch (err: unknown) {
      setStatusType('NOT_FOUND');
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStatusType('IDLE');
    setVerifiedEmployee(null);
    setAttendanceRecord(null);
    setEmployeeId('');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-blue-950 text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6">
      {/* Header */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-2 border-b border-slate-800/80">
        <MTechnoLogo size="sm" variant="light" />
        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5 text-xs font-mono font-bold text-cyan-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{currentTime || '09:00 AM'}</span>
          </div>
          <div className="flex items-center justify-end gap-1 text-[11px] text-slate-400">
            <Calendar className="w-3 h-3" />
            <span>{currentDate || '07 September 2026'}</span>
          </div>
        </div>
      </header>

      {/* Main Terminal Card */}
      <main className="max-w-md mx-auto w-full my-auto py-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* STATE 1: IDLE / FORM */}
          {statusType === 'IDLE' && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-2xl overflow-hidden p-1 bg-white border border-slate-700 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="M Technovate Solutions" className="w-full h-full object-contain" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-cyan-400 border border-blue-500/20">
                  <Sparkles className="w-3 h-3" /> Office Entrance Terminal
                </span>
                <h1 className="text-2xl font-black text-white">
                  M Technovate Solutions
                </h1>
                <h2 className="text-sm font-semibold text-slate-400">
                  Employee Attendance
                </h2>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerifyAndMark();
                }}
                className="space-y-4 text-left"
              >
                <div>
                  <label
                    htmlFor="empIdInput"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2"
                  >
                    Enter your Employee ID
                  </label>
                  <div className="relative">
                    <input
                      id="empIdInput"
                      type="text"
                      required
                      autoFocus
                      maxLength={10}
                      placeholder="e.g. MT001"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3.5 bg-slate-800/90 border-2 border-slate-700 hover:border-blue-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl font-mono text-lg font-black text-white tracking-widest placeholder:text-slate-500 placeholder:font-sans placeholder:font-normal placeholder:text-sm focus:outline-none transition-all"
                    />
                    <span className="absolute right-3.5 top-3.5 px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 text-[11px] font-mono font-bold">
                      MT
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 active:scale-98 disabled:opacity-50 text-white rounded-2xl font-black text-sm tracking-wider uppercase shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying Identity...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5" />
                      <span>Verify & Mark Attendance</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Test Buttons */}
              <div className="pt-4 border-t border-slate-800/80 text-left">
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-2">
                  Test Profiles (From Database):
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeId('MT001');
                      handleVerifyAndMark('MT001');
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono font-semibold text-blue-300 transition-colors"
                  >
                    MT001 (Naveen Kumar)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeId('MT002');
                      handleVerifyAndMark('MT002');
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono font-semibold text-cyan-300 transition-colors"
                  >
                    MT002 (Rahul Kumar)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeId('MT005');
                      handleVerifyAndMark('MT005');
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono font-semibold text-amber-300 transition-colors"
                  >
                    MT005 (Inactive Test)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeId('MT999');
                      handleVerifyAndMark('MT999');
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono font-semibold text-rose-300 transition-colors"
                  >
                    MT999 (Not Found)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: SUCCESS CHECK-IN */}
          {statusType === 'SUCCESS_CHECK_IN' && verifiedEmployee && attendanceRecord && (
            <div className="text-center space-y-5 animate-in fade-in zoom-in duration-300">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Attendance Verified</span>
              </div>

              {/* Employee Registered Photo */}
              <div className="relative mx-auto w-28 h-28 rounded-full ring-4 ring-emerald-500/40 shadow-xl overflow-hidden bg-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={verifiedEmployee.photoUrl}
                  alt={verifiedEmployee.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">{verifiedEmployee.name}</h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-mono text-xs font-bold">
                    {verifiedEmployee.employeeId}
                  </span>
                  <span className="text-slate-400 text-xs font-medium">
                    {verifiedEmployee.department}
                  </span>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3">
                <h3 className="text-base font-bold text-cyan-400 tracking-wide">
                  Welcome to M Technovate Solutions
                </h3>
                <p className="text-[11px] text-slate-400 italic">Innovate at every step</p>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/60 text-xs">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/40">
                    <p className="text-[11px] text-slate-400 uppercase font-semibold">Check-In Time</p>
                    <p className="font-mono text-sm font-black text-emerald-400 mt-0.5">
                      {attendanceRecord.checkInTime}
                    </p>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/40">
                    <p className="text-[11px] text-slate-400 uppercase font-semibold">Date</p>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">
                      {attendanceRecord.displayDate}
                    </p>
                  </div>
                </div>

                {attendanceRecord.status === 'Late' && (
                  <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs font-semibold">
                    Late Arrival (Shift starts at {settings?.workStartTime || '09:30 AM'})
                  </div>
                )}
              </div>

              <div className="py-3 px-4 bg-emerald-600 rounded-2xl text-white font-black text-sm tracking-wide shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Attendance Marked Successfully ✓</span>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto pt-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Mark Another Employee</span>
              </button>
            </div>
          )}

          {/* STATE 3: SUCCESS CHECK-OUT */}
          {statusType === 'SUCCESS_CHECK_OUT' && verifiedEmployee && attendanceRecord && (
            <div className="text-center space-y-5 animate-in fade-in zoom-in duration-300">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
                <LogOut className="w-4 h-4 text-cyan-400" />
                <span>Check-Out Recorded</span>
              </div>

              <div className="relative mx-auto w-28 h-28 rounded-full ring-4 ring-cyan-500/40 shadow-xl overflow-hidden bg-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={verifiedEmployee.photoUrl}
                  alt={verifiedEmployee.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">{verifiedEmployee.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {verifiedEmployee.employeeId} • {verifiedEmployee.department}
                </p>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-300">
                  Have a great evening from M Technovate Solutions!
                </h3>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/60 text-xs">
                  <div className="bg-slate-900/80 p-2 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Check-In</p>
                    <p className="font-mono text-xs font-bold text-slate-200 mt-0.5">
                      {attendanceRecord.checkInTime}
                    </p>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Check-Out</p>
                    <p className="font-mono text-xs font-bold text-cyan-400 mt-0.5">
                      {attendanceRecord.checkOutTime}
                    </p>
                  </div>
                  <div className="bg-cyan-950/60 border border-cyan-800/40 p-2 rounded-xl">
                    <p className="text-[10px] text-cyan-300 uppercase font-semibold">Total Hours</p>
                    <p className="font-mono text-xs font-black text-cyan-300 mt-0.5">
                      {attendanceRecord.totalHours}
                    </p>
                  </div>
                </div>
              </div>

              <div className="py-3 px-4 bg-cyan-600 rounded-2xl text-white font-black text-sm tracking-wide shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Check-Out Completed Successfully ✓</span>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto pt-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Mark Another Employee</span>
              </button>
            </div>
          )}

          {/* STATE 4: ALREADY COMPLETED */}
          {statusType === 'ALREADY_COMPLETED' && (
            <div className="text-center space-y-5 animate-in fade-in zoom-in duration-300">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Already Checked In</span>
              </div>

              {verifiedEmployee && (
                <div className="space-y-3">
                  <div className="relative mx-auto w-24 h-24 rounded-full ring-4 ring-amber-500/30 shadow-lg overflow-hidden bg-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={verifiedEmployee.photoUrl}
                      alt={verifiedEmployee.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{verifiedEmployee.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {verifiedEmployee.employeeId} • {verifiedEmployee.department}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-slate-800/80 border border-amber-500/20 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
                <p className="font-semibold text-amber-300">You already marked your attendance today.</p>
                {attendanceRecord && (
                  <div className="pt-2 text-slate-400 space-y-1">
                    <p>
                      <strong>Check-In Time:</strong>{' '}
                      <span className="text-white font-mono">{attendanceRecord.checkInTime}</span>
                    </p>
                    {attendanceRecord.checkOutTime && (
                      <p>
                        <strong>Check-Out Time:</strong>{' '}
                        <span className="text-white font-mono">{attendanceRecord.checkOutTime}</span>
                      </p>
                    )}
                    {attendanceRecord.totalHours && (
                      <p>
                        <strong>Total Hours:</strong>{' '}
                        <span className="text-cyan-400 font-mono font-bold">
                          {attendanceRecord.totalHours}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Back to Scanner
              </button>
            </div>
          )}

          {/* STATE 5: NOT FOUND */}
          {statusType === 'NOT_FOUND' && (
            <div className="text-center space-y-5 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-white">Employee Not Found</h2>
                <p className="text-xs text-rose-300 font-semibold">
                  The Employee ID you entered is not registered.
                </p>
              </div>

              <div className="bg-rose-950/30 border border-rose-900/40 rounded-2xl p-4 text-xs text-rose-200">
                <p>Please enter a valid Employee ID or contact the M Technovate Solutions administrator.</p>
                <p className="mt-2 font-mono text-slate-400">
                  Entered ID: <span className="text-rose-400 font-bold">{employeeId || 'None'}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
              >
                Try Again
              </button>
            </div>
          )}

          {/* STATE 6: INACTIVE */}
          {statusType === 'INACTIVE' && (
            <div className="text-center space-y-5 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-white">Access Denied</h2>
                <p className="text-xs text-amber-300 font-semibold">
                  This employee account is currently inactive.
                </p>
              </div>

              {verifiedEmployee && (
                <div className="flex items-center gap-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-left">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={verifiedEmployee.photoUrl}
                    alt={verifiedEmployee.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-600"
                  />
                  <div>
                    <p className="text-sm font-bold text-white">{verifiedEmployee.name}</p>
                    <p className="text-xs text-slate-400">
                      {verifiedEmployee.employeeId} • {verifiedEmployee.department}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-amber-950/30 border border-amber-900/40 rounded-2xl p-4 text-xs text-amber-200">
                <p>
                  Please contact the administrator to reactivate your account before marking attendance.
                </p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Back to Scanner
              </button>
            </div>
          )}

          {/* STATE 7: LOCATION ERROR */}
          {statusType === 'LOCATION_ERROR' && (
            <div className="text-center space-y-5 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto">
                <MapPin className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-white">Outside Office Location</h2>
                <p className="text-xs text-rose-300 font-semibold">
                  You must be at the M Technovate Solutions office location to mark attendance.
                </p>
              </div>

              <div className="bg-rose-950/30 border border-rose-900/40 rounded-2xl p-4 text-xs text-rose-200">
                <p>{errorMessage}</p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="max-w-md mx-auto w-full text-center py-2 space-y-1 text-[11px] text-slate-500">
        <p>© 2026 M Technovate Solutions. All Rights Reserved.</p>
        <p>Innovate at every step • Secure Office Entrance Attendance</p>
      </footer>
    </div>
  );
}
