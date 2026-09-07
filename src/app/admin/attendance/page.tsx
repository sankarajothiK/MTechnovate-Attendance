'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import QRCodeModal from '@/components/QRCodeModal';
import FirebaseSettingsModal from '@/components/FirebaseSettingsModal';
import {
  CalendarCheck,
  Search,
  Download,
  Filter,
  ArrowLeft,
  Calendar,
  Clock,
  UserCheck,
  Building,
  RefreshCw,
} from 'lucide-react';
import { getAllAttendance, getEmployees } from '@/lib/db';
import { AttendanceRecord, Employee } from '@/types';
import { getStoredAdmin } from '@/lib/auth';
import { getCurrentDateKey, formatDisplayDate } from '@/lib/dateUtils';
import Link from 'next/link';

export default function AttendanceHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(''); // empty means all dates
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  useEffect(() => {
    if (!getStoredAdmin()) {
      router.push('/login');
    }
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allAtt, allEmps] = await Promise.all([getAllAttendance(), getEmployees()]);
      setRecords(allAtt);
      setEmployees(allEmps);
    } catch (e) {
      console.error('Error loading attendance history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const departments = Array.from(new Set(employees.map((e) => e.department))).filter(Boolean);

  // Filter records
  const filteredRecords = records.filter((rec) => {
    const matchesDate = !selectedDate || rec.date === selectedDate;

    const matchesSearch =
      rec.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = departmentFilter === 'ALL' || rec.department === departmentFilter;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'CHECKED_OUT' && Boolean(rec.checkOutTime)) ||
      rec.status === statusFilter;

    return matchesDate && matchesSearch && matchesDept && matchesStatus;
  });

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('No attendance records to export.');
      return;
    }

    const headers = [
      'Date',
      'Display Date',
      'Employee ID',
      'Employee Name',
      'Department',
      'Check-In Time',
      'Check-Out Time',
      'Total Working Hours',
      'Status',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.date}"`,
      `"${r.displayDate}"`,
      `"${r.employeeId}"`,
      `"${r.employeeName}"`,
      `"${r.department}"`,
      `"${r.checkInTime}"`,
      `"${r.checkOutTime || '-'}"`,
      `"${r.totalHours || '-'}"`,
      `"${r.status}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateLabel = selectedDate || 'all-dates';
    link.setAttribute('download', `M-Techno-Attendance-Report-${dateLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        onOpenQRModal={() => setIsQRModalOpen(true)}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Attendance History
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive log of daily employee check-ins, check-outs, and working hours
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={loadData}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 shadow-2xs transition-colors shrink-0"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors active:scale-95 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV / Excel</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="ID, Name, Department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Filter by Date
                </label>
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate('')}
                    className="text-[10px] text-blue-600 hover:underline font-semibold"
                  >
                    View All
                  </button>
                )}
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Attendance Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="CHECKED_OUT">Checked Out Only</option>
              </select>
            </div>
          </div>

          {/* Quick Date Chips */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs overflow-x-auto pb-1">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0">Quick Select:</span>
            <button
              onClick={() => setSelectedDate(getCurrentDateKey())}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                selectedDate === getCurrentDateKey()
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate('')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                selectedDate === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Records ({records.length})
            </button>
          </div>
        </div>

        {/* Attendance Records Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* 1. Mobile Cards View (Screen < sm) */}
          <div className="sm:hidden">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Loading attendance records...
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No attendance records found matching filters.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredRecords.map((rec) => (
                  <div key={rec.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-mono font-bold text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                            {rec.employeeId}
                          </span>
                          <span className="text-[10px] text-slate-400">{rec.displayDate}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{rec.employeeName}</h4>
                        <p className="text-[11px] text-slate-500">{rec.department}</p>
                      </div>

                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          rec.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : rec.status === 'Late'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {rec.checkOutTime ? 'Checked Out' : rec.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-2.5 rounded-xl text-center text-xs border border-slate-100">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">In</p>
                        <p className="font-mono font-bold text-emerald-600 mt-0.5">{rec.checkInTime}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Out</p>
                        <p className="font-mono font-bold text-slate-700 mt-0.5">
                          {rec.checkOutTime || <span className="text-slate-400 font-normal italic">Active</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Duration</p>
                        <p className="font-mono font-bold text-blue-600 mt-0.5">{rec.totalHours || '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Desktop Table View (Screen >= sm) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Date</th>
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Employee Name</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Check-In</th>
                  <th className="py-3.5 px-4">Check-Out</th>
                  <th className="py-3.5 px-4">Total Hours</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading attendance records...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No attendance records found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-semibold text-slate-900">{rec.displayDate}</div>
                        <div className="font-mono text-[10px] text-slate-400">{rec.date}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                          {rec.employeeId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">{rec.employeeName}</td>

                      <td className="py-3.5 px-4 text-slate-600">{rec.department}</td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                        {rec.checkInTime}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {rec.checkOutTime ? (
                          <span className="font-bold text-cyan-600">{rec.checkOutTime}</span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">— In Shift —</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {rec.totalHours || '—'}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            rec.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : rec.status === 'Late'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <QRCodeModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />
      <FirebaseSettingsModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
    </div>
  );
}
