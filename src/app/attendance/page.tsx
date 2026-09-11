'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  ShieldAlert,
  LogOut,
  MapPin,
  Sparkles,
  RefreshCw,
  Lock,
  DoorOpen,
  LogIn,
  HelpCircle,
  Timer,
} from 'lucide-react';
import { verifyAndMarkAttendance, getOfficeSettings } from '@/lib/db';
import { Employee, AttendanceRecord, OfficeSettings } from '@/types';
import { formatTime12h, formatDisplayDate, getCurrentDateKey } from '@/lib/dateUtils';
import Link from 'next/link';

export default function AttendancePage() {
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [settings, setSettings] = useState<OfficeSettings | null>(null);

  // Selected Action Mode
  const [selectedAction, setSelectedAction] = useState<'AUTO' | 'PERMISSION_OUT' | 'PERMISSION_IN'>('AUTO');
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Result States
  const [statusType, setStatusType] = useState<
    | 'IDLE'
    | 'SUCCESS_CHECK_IN'
    | 'SUCCESS_CHECK_OUT'
    | 'SUCCESS_PERMISSION_OUT'
    | 'SUCCESS_PERMISSION_IN'
    | 'ALREADY_COMPLETED'
    | 'NOT_FOUND'
    | 'INACTIVE'
    | 'LOCATION_ERROR'
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
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#b76e79', '#c5838d', '#e8c3b9', '#10b981', '#3b82f6'],
      });
    } catch {
      // Fallback
    }
  };

  const handleExecuteAttendance = async (
    actionToRun: 'AUTO' | 'CHECK_IN' | 'CHECK_OUT' | 'PERMISSION_OUT' | 'PERMISSION_IN',
    willReturnToday = true
  ) => {
    const targetId = employeeId.trim().toUpperCase();
    if (!targetId) {
      setErrorMessage('Please enter your Employee ID (e.g. MT001)');
      setStatusType('NOT_FOUND');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setShowReturnModal(false);
    setVerifiedEmployee(null);
    setAttendanceRecord(null);

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
      const now = new Date();
      const localTime = formatTime12h(now);
      const localDateKey = getCurrentDateKey(now);

      const result = await verifyAndMarkAttendance(targetId, coords, {
        clientTime: localTime,
        clientDateKey: localDateKey,
        action: actionToRun,
        willReturnToday,
      });

      if (result.success) {
        setVerifiedEmployee(result.employee || null);
        setAttendanceRecord(result.record || null);

        if (result.type === 'CHECK_IN') {
          setStatusType('SUCCESS_CHECK_IN');
          triggerConfetti();
        } else if (result.type === 'CHECK_OUT') {
          setStatusType('SUCCESS_CHECK_OUT');
          triggerConfetti();
        } else if (result.type === 'PERMISSION_OUT') {
          setStatusType('SUCCESS_PERMISSION_OUT');
          triggerConfetti();
        } else if (result.type === 'PERMISSION_IN') {
          setStatusType('SUCCESS_PERMISSION_IN');
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
        } else if (result.message?.includes('inactive')) {
          setStatusType('INACTIVE');
          setErrorMessage(result.message);
        } else if (
          result.message?.includes('Outside Office Location') ||
          result.message?.includes('Location verification')
        ) {
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      setErrorMessage('Please enter your Employee ID (e.g. MT001)');
      setStatusType('NOT_FOUND');
      return;
    }

    if (selectedAction === 'PERMISSION_OUT') {
      // Prompt if returning today or not
      setShowReturnModal(true);
      return;
    }

    handleExecuteAttendance(selectedAction);
  };

  const handleReset = () => {
    setStatusType('IDLE');
    setVerifiedEmployee(null);
    setAttendanceRecord(null);
    setEmployeeId('');
    setErrorMessage('');
    setSelectedAction('AUTO');
    setShowReturnModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdfbfb] via-[#fff8f8] to-[#fbf2f2] text-slate-900 flex flex-col justify-between py-6 px-4 sm:px-6 relative overflow-hidden">
      {/* Top Rose Gold Hairline */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#e8c3b9] via-[#c5838d] to-[#b76e79]" />

      {/* Ambient Soft Glow Circles */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-3 border-b border-[#ebdcdc] relative z-10">
        <Link href="/admin" className="flex items-center gap-2.5 select-none group">
          <div className="w-9 h-9 rounded-xl p-0.5 bg-white ring-2 ring-[#ebdcdc] group-hover:ring-[#b76e79] shadow-xs overflow-hidden flex items-center justify-center transition-all">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="M Technovate" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-xs font-black tracking-tight text-slate-900">
              M TECHNOVATE <span className="text-[#b76e79]">SOLUTIONS</span>
            </p>
            <p className="text-[9px] font-semibold text-[#a0636d] uppercase tracking-wider">
              Innovate at every step
            </p>
          </div>
        </Link>

        {/* Live Clock Pill */}
        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#ebdcdc] text-xs font-mono font-bold text-[#8e4a55] shadow-2xs">
            <Clock className="w-3 h-3 text-[#b76e79]" />
            <span>{currentTime || '09:00 AM'}</span>
          </div>
          <p className="text-[10px] font-medium text-slate-400 mt-0.5 pr-1">
            {currentDate || '11 September 2026'}
          </p>
        </div>
      </header>

      {/* Main Terminal Card */}
      <main className="max-w-md mx-auto w-full my-auto py-6 relative z-10">
        <div className="bg-white/95 backdrop-blur-xl border border-[#ebdcdc] rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_-10px_rgba(183,110,121,0.12)] relative overflow-hidden transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#c5838d]/40 to-transparent" />

          {/* STATE 1: IDLE / FORM */}
          {statusType === 'IDLE' && (
            <div className="space-y-6 text-center">
              {/* Floating Logo Badge */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-2xl p-1.5 bg-white shadow-md shadow-[#b76e79]/15 ring-2 ring-[#ebdcdc] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="M Technovate Solutions" className="w-full h-full object-contain" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-[#fff5f5] text-[#8e4a55] border border-[#ecd2cf]">
                  <Sparkles className="w-3 h-3 text-[#b76e79]" /> Office Attendance & Gate Pass
                </span>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Mark Attendance / Permission
                </h1>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Enter your Employee ID to record Check-In, Check-Out, or Gate Pass Permission.
                </p>
              </div>

              {/* Action Selector Pills */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedAction('AUTO')}
                  className={`py-2 px-1 rounded-xl transition-all ${
                    selectedAction === 'AUTO'
                      ? 'bg-white text-[#8e4a55] shadow-xs font-black ring-1 ring-[#ebdcdc]'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Daily Attendance
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAction('PERMISSION_OUT')}
                  className={`py-2 px-1 rounded-xl transition-all ${
                    selectedAction === 'PERMISSION_OUT'
                      ? 'bg-amber-500 text-white shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  🚪 Permission Out
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAction('PERMISSION_IN')}
                  className={`py-2 px-1 rounded-xl transition-all ${
                    selectedAction === 'PERMISSION_IN'
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  🔙 Permission In
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
                <div>
                  <label
                    htmlFor="empIdInput"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#8e4a55] mb-2"
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
                      className="w-full px-4 py-3.5 bg-[#fdfbfb] border-2 border-[#ebdcdc] hover:border-[#c5838d] focus:border-[#b76e79] focus:ring-4 focus:ring-[#b76e79]/15 rounded-2xl font-mono text-lg font-black text-slate-900 tracking-widest placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal placeholder:text-sm focus:outline-none transition-all shadow-inner"
                    />
                    <span className="absolute right-3.5 top-3.5 px-2.5 py-1 rounded-lg bg-[#fff5f5] text-[#8e4a55] border border-[#ecd2cf] text-xs font-mono font-bold">
                      MT
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer border text-white ${
                    selectedAction === 'PERMISSION_OUT'
                      ? 'bg-amber-500 hover:bg-amber-600 border-amber-400 shadow-amber-500/25'
                      : selectedAction === 'PERMISSION_IN'
                      ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500 shadow-emerald-600/25'
                      : 'bg-gradient-to-r from-[#b76e79] via-[#c5838d] to-[#9e5762] hover:from-[#a8606b] hover:to-[#8c4651] border-[#e5b3b9] shadow-[#b76e79]/25'
                  }`}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : selectedAction === 'PERMISSION_OUT' ? (
                    <>
                      <DoorOpen className="w-4 h-4" />
                      <span>Record Permission Out</span>
                    </>
                  ) : selectedAction === 'PERMISSION_IN' ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Record Permission Return</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Verify & Mark Attendance</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Helper */}
              <div className="pt-3 border-t border-[#f2e6e6] text-center space-y-1">
                <p className="text-[11px] text-slate-400">
                  1st scan: <strong>Check-In</strong> • 2nd scan: <strong>Check-Out</strong>
                </p>
                <p className="text-[10px] text-amber-700 font-semibold">
                  Taking permission? Select <strong>Permission Out</strong> above.
                </p>
              </div>
            </div>
          )}

          {/* PERMISSION RETURN CONFIRMATION MODAL */}
          {showReturnModal && (
            <div className="space-y-5 text-center animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto shadow-xs">
                <HelpCircle className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900">Are you returning today?</h2>
                <p className="text-xs text-slate-500">
                  Employee <span className="font-bold text-slate-800">{employeeId}</span> is taking a permission.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleExecuteAttendance('PERMISSION_OUT', true)}
                  className="w-full p-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <DoorOpen className="w-4 h-4" />
                  <div className="text-left">
                    <p className="font-black">Yes, I will return later today</p>
                    <p className="text-[10px] opacity-85 font-normal">Records Permission Out (Gate Pass)</p>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleExecuteAttendance('PERMISSION_OUT', false)}
                  className="w-full p-4 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <div className="text-left">
                    <p className="font-black">No, leaving for the day</p>
                    <p className="text-[10px] opacity-85 font-normal">Directly marks final Check-Out</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 pt-2"
                >
                  Cancel & Go Back
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: SUCCESS CHECK-IN */}
          {statusType === 'SUCCESS_CHECK_IN' && verifiedEmployee && attendanceRecord && (
            <div className="text-center space-y-5 animate-in fade-in zoom-in duration-300">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Attendance Verified</span>
              </div>

              <div className="relative mx-auto w-28 h-28 rounded-full ring-4 ring-[#e8c3b9] shadow-xl overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={verifiedEmployee.photoUrl}
                  alt={verifiedEmployee.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900">{verifiedEmployee.name}</h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#fff5f5] text-[#8e4a55] border border-[#ecd2cf] font-mono text-xs font-bold">
                    {verifiedEmployee.employeeId}
                  </span>
                  <span className="text-slate-500 text-xs font-medium">
                    {verifiedEmployee.department}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#fff7f7] to-[#fcf2f2] border border-[#ebdcdc] rounded-2xl p-4 space-y-3 shadow-xs">
                <h3 className="text-base font-bold text-[#8e4a55] tracking-wide">
                  Welcome to M Technovate Solutions
                </h3>
                <p className="text-[11px] text-slate-400 italic">Innovate at every step</p>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#ebdcdc] text-xs">
                  <div className="bg-white p-3 rounded-xl border border-[#ebdcdc] shadow-2xs">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Check-In Time</p>
                    <p className="font-mono text-sm font-black text-emerald-700 mt-0.5">
                      {attendanceRecord.checkInTime}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#ebdcdc] shadow-2xs">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Date</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      {attendanceRecord.displayDate}
                    </p>
                  </div>
                </div>

                {attendanceRecord.status === 'Late' && (
                  <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-semibold">
                    Late Arrival (Shift threshold: {settings?.workStartTime || '09:30 AM'})
                  </div>
                )}
              </div>

              <div className="py-3 px-4 bg-gradient-to-r from-[#b76e79] via-[#c5838d] to-[#9e5762] rounded-2xl text-white font-black text-xs tracking-wider uppercase shadow-md shadow-[#b76e79]/25 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Attendance Marked Successfully ✓</span>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-[#8e4a55] hover:text-[#b76e79] flex items-center justify-center gap-1.5 mx-auto pt-1 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Mark Another Employee</span>
              </button>
            </div>
          )}

          {/* STATE 3: SUCCESS CHECK-OUT */}
          {statusType === 'SUCCESS_CHECK_OUT' && verifiedEmployee && attendanceRecord && (
            <div className="text-center space-y-5 animate-in fade-in zoom-in duration-300">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold">
                <LogOut className="w-4 h-4 text-cyan-600" />
                <span>Check-Out Recorded</span>
              </div>

              <div className="relative mx-auto w-28 h-28 rounded-full ring-4 ring-cyan-200 shadow-xl overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={verifiedEmployee.photoUrl}
                  alt={verifiedEmployee.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900">{verifiedEmployee.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {verifiedEmployee.employeeId} • {verifiedEmployee.department}
                </p>
              </div>

              <div className="bg-gradient-to-br from-[#fff7f7] to-[#fcf2f2] border border-[#ebdcdc] rounded-2xl p-4 space-y-3 shadow-xs">
                <h3 className="text-sm font-bold text-slate-800">
                  Have a great evening from M Technovate Solutions!
                </h3>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#ebdcdc] text-xs">
                  <div className="bg-white p-2 rounded-xl border border-[#ebdcdc]">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Check-In</p>
                    <p className="font-mono text-xs font-bold text-slate-700 mt-0.5">
                      {attendanceRecord.checkInTime}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#ebdcdc]">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Check-Out</p>
                    <p className="font-mono text-xs font-bold text-cyan-700 mt-0.5">
                      {attendanceRecord.checkOutTime}
                    </p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl">
                    <p className="text-[10px] text-emerald-800 uppercase font-semibold">Total Hours</p>
                    <p className="font-mono text-xs font-black text-emerald-800 mt-0.5">
                      {attendanceRecord.totalHours}
                    </p>
                  </div>
                </div>
              </div>

              <div className="py-3 px-4 bg-cyan-600 rounded-2xl text-white font-black text-xs tracking-wider uppercase shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Check-Out Completed Successfully ✓</span>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-[#8e4a55] hover:text-[#b76e79] flex items-center justify-center gap-1.5 mx-auto pt-1 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Mark Another Employee</span>
              </button>
            </div>
          )}

          {/* STATE 4: SUCCESS PERMISSION OUT */}
          {statusType === 'SUCCESS_PERMISSION_OUT' && verifiedEmployee && attendanceRecord && (
            <div className="text-center space-y-5 animate-in fade-in zoom-in duration-300">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                <DoorOpen className="w-4 h-4 text-amber-600" />
                <span>Permission Out Recorded (Gate Pass)</span>
              </div>

              <div className="relative mx-auto w-28 h-28 rounded-full ring-4 ring-amber-200 shadow-xl overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={verifiedEmployee.photoUrl}
                  alt={verifiedEmployee.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900">{verifiedEmployee.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {verifiedEmployee.employeeId} • {verifiedEmployee.department}
                </p>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs text-amber-900">
                <p className="font-bold">Gate Pass Permission Active</p>
                <div className="bg-white p-3 rounded-xl border border-amber-100 flex items-center justify-between">
                  <span className="text-slate-500">Permission Out Time:</span>
                  <span className="font-mono font-bold text-amber-800">{attendanceRecord.permissionOutTime}</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Please scan again when returning to record <strong>Permission In</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 bg-[#fff5f5] hover:bg-[#fae8e8] text-[#8e4a55] border border-[#ecd2cf] rounded-xl text-xs font-bold transition-colors"
              >
                Done • Mark Another Employee
              </button>
            </div>
          )}

          {/* STATE 5: SUCCESS PERMISSION IN */}
          {statusType === 'SUCCESS_PERMISSION_IN' && verifiedEmployee && attendanceRecord && (
            <div className="text-center space-y-5 animate-in fade-in zoom-in duration-300">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <LogIn className="w-4 h-4 text-emerald-600" />
                <span>Welcome Back • Permission In Recorded</span>
              </div>

              <div className="relative mx-auto w-28 h-28 rounded-full ring-4 ring-emerald-200 shadow-xl overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={verifiedEmployee.photoUrl}
                  alt={verifiedEmployee.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900">{verifiedEmployee.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {verifiedEmployee.employeeId} • {verifiedEmployee.department}
                </p>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2 text-xs text-emerald-900">
                <p className="font-bold">Permission Completed</p>
                <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-emerald-100 text-left">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold">Out Time</p>
                    <p className="font-mono font-bold text-slate-800 text-xs">{attendanceRecord.permissionOutTime}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold">In Time</p>
                    <p className="font-mono font-bold text-emerald-700 text-xs">{attendanceRecord.permissionInTime}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold">Duration</p>
                    <p className="font-mono font-bold text-amber-700 text-xs">{attendanceRecord.permissionDuration}</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-emerald-600/20"
              >
                Done • Back to Terminal
              </button>
            </div>
          )}

          {/* STATE 6: ALREADY COMPLETED */}
          {statusType === 'ALREADY_COMPLETED' && (
            <div className="text-center space-y-5 animate-in fade-in zoom-in duration-300">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Attendance Completed</span>
              </div>

              {verifiedEmployee && (
                <div className="space-y-3">
                  <div className="relative mx-auto w-24 h-24 rounded-full ring-4 ring-amber-200 shadow-lg overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={verifiedEmployee.photoUrl}
                      alt={verifiedEmployee.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{verifiedEmployee.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {verifiedEmployee.employeeId} • {verifiedEmployee.department}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
                <p className="font-bold">You already marked your attendance today.</p>
                {attendanceRecord && (
                  <div className="pt-2 text-slate-600 space-y-1 text-left bg-white p-3 rounded-xl border border-amber-100">
                    <p>
                      <strong>Check-In Time:</strong>{' '}
                      <span className="text-slate-900 font-mono font-bold">{attendanceRecord.checkInTime}</span>
                    </p>
                    {attendanceRecord.permissionDuration && (
                      <p>
                        <strong>Permission Away:</strong>{' '}
                        <span className="text-amber-700 font-mono font-bold">{attendanceRecord.permissionDuration}</span>
                      </p>
                    )}
                    {attendanceRecord.checkOutTime && (
                      <p>
                        <strong>Check-Out Time:</strong>{' '}
                        <span className="text-slate-900 font-mono font-bold">{attendanceRecord.checkOutTime}</span>
                      </p>
                    )}
                    {attendanceRecord.totalHours && (
                      <p>
                        <strong>Total Hours:</strong>{' '}
                        <span className="text-emerald-700 font-mono font-bold">
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
                className="w-full py-3 bg-[#fff5f5] hover:bg-[#fae8e8] text-[#8e4a55] border border-[#ecd2cf] rounded-xl text-xs font-bold transition-colors"
              >
                Back to Scanner
              </button>
            </div>
          )}

          {/* STATE 7: NOT FOUND */}
          {statusType === 'NOT_FOUND' && (
            <div className="text-center space-y-5 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto shadow-xs">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900">Employee Not Found</h2>
                <p className="text-xs text-rose-700 font-semibold">
                  The Employee ID you entered is not registered.
                </p>
              </div>

              <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800">
                <p>Please enter a valid Employee ID or contact the administrator.</p>
                <p className="mt-2 font-mono text-slate-500">
                  Entered ID: <span className="text-rose-700 font-bold">{employeeId || 'None'}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-rose-600/20"
              >
                Try Again
              </button>
            </div>
          )}

          {/* STATE 8: INACTIVE */}
          {statusType === 'INACTIVE' && (
            <div className="text-center space-y-5 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto shadow-xs">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900">Access Denied</h2>
                <p className="text-xs text-amber-800 font-semibold">
                  This employee account is currently inactive.
                </p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Back to Scanner
              </button>
            </div>
          )}

          {/* STATE 9: LOCATION ERROR */}
          {statusType === 'LOCATION_ERROR' && (
            <div className="text-center space-y-5 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
                <MapPin className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900">Outside Office Location</h2>
                <p className="text-xs text-rose-700 font-semibold">
                  You must be at the M Technovate Solutions office location to mark attendance.
                </p>
              </div>

              <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900">
                <p>{errorMessage}</p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Security Footer */}
      <footer className="max-w-md mx-auto w-full text-center py-2 space-y-1 text-[11px] text-slate-400 relative z-10">
        <p className="font-semibold text-[#8e4a55]">© 2026 M Technovate Solutions. All Rights Reserved.</p>
        <p className="flex items-center justify-center gap-1">
          <Lock className="w-3 h-3 text-[#b76e79]" />
          <span>Innovate at every step • Secure Cloud Attendance</span>
        </p>
      </footer>
    </div>
  );
}
