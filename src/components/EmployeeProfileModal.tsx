'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Briefcase,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Edit,
  History,
} from 'lucide-react';
import { Employee, AttendanceRecord } from '@/types';
import { getEmployeeAttendance } from '@/lib/db';

interface EmployeeProfileModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (employee: Employee) => void;
}

export default function EmployeeProfileModal({
  employee,
  isOpen,
  onClose,
  onEdit,
}: EmployeeProfileModalProps) {
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (employee && isOpen) {
      setLoadingHistory(true);
      getEmployeeAttendance(employee.employeeId)
        .then((records) => setHistory(records.slice(0, 5)))
        .finally(() => setLoadingHistory(false));
    }
  }, [employee, isOpen]);

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header with gradient banner */}
        <div className="h-28 bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar overlapping banner */}
          <div className="-mt-14 mb-4 flex items-end justify-between">
            <div className="relative w-24 h-24 rounded-2xl ring-4 ring-white shadow-lg overflow-hidden bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={employee.photoUrl}
                alt={employee.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                  employee.status === 'Active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {employee.status}
              </span>

              <button
                onClick={() => {
                  onClose();
                  onEdit(employee);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>

          {/* Name & ID */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-900">{employee.name}</h3>
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono text-xs font-bold">
                {employee.employeeId}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {employee.designation} • {employee.department}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-4">
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{employee.email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{employee.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{employee.department}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Joined {employee.joiningDate}</span>
            </div>
          </div>

          {/* Recent Attendance Records */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <History className="w-4 h-4 text-blue-600" />
              Recent Attendance
            </h4>

            {loadingHistory ? (
              <p className="text-xs text-slate-400 italic">Loading attendance records...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No attendance marked yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {history.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{rec.displayDate}</p>
                      <p className="text-[11px] text-slate-500">
                        In: {rec.checkInTime} {rec.checkOutTime && `• Out: ${rec.checkOutTime}`}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'Late'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {rec.status}
                      </span>
                      {rec.totalHours && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{rec.totalHours}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
