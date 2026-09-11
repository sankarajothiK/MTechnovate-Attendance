'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AddEmployeeModal from '@/components/AddEmployeeModal';
import EditEmployeeModal from '@/components/EditEmployeeModal';
import EmployeeProfileModal from '@/components/EmployeeProfileModal';
import QRCodeModal from '@/components/QRCodeModal';
import FirebaseSettingsModal from '@/components/FirebaseSettingsModal';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Plus,
  QrCode,
  Search,
  Filter,
  Eye,
  Edit,
  PowerOff,
  History,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Database,
} from 'lucide-react';
import {
  getEmployees,
  getTodayAttendance,
  updateEmployee,
  getOfficeSettings,
  cleanAllDuplicates,
} from '@/lib/db';
import { Employee, AttendanceRecord, OfficeSettings } from '@/types';
import { getStoredAdmin } from '@/lib/auth';
import { getCurrentDateKey, formatDisplayDate } from '@/lib/dateUtils';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<OfficeSettings | null>(null);
  const [cleanMessage, setCleanMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const admin = getStoredAdmin();
    if (!admin) {
      router.push('/login');
    }
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [emps, att, setts] = await Promise.all([
        getEmployees(),
        getTodayAttendance(),
        getOfficeSettings(),
      ]);
      setEmployees(emps);
      setTodayAttendance(att);
      setSettings(setts);
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCleanDuplicates = async () => {
    const res = await cleanAllDuplicates();
    await loadData();
    if (res.removedCount > 0) {
      setCleanMessage(`Removed ${res.removedCount} duplicate record(s)! Now showing ${res.employeeCount} unique employees.`);
    } else {
      setCleanMessage(`Database is clean! All ${res.employeeCount} employees have unique IDs.`);
    }
    setTimeout(() => setCleanMessage(null), 4000);
  };

  // Metrics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === 'Active').length;
  const presentRecords = todayAttendance.filter((r) => r.status === 'Present');
  const lateRecords = todayAttendance.filter((r) => r.status === 'Late');
  const totalPresent = todayAttendance.length;
  const absentCount = Math.max(0, activeEmployees - totalPresent);

  const getEmployeeTodayStatus = (empId: string): { text: string; color: string; record?: AttendanceRecord } => {
    const rec = todayAttendance.find((r) => r.employeeId.toUpperCase() === empId.toUpperCase());
    if (!rec) {
      return { text: 'Absent', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (rec.checkOutTime) {
      return {
        text: `Checked Out (${rec.totalHours || ''})`,
        color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        record: rec,
      };
    }
    if (rec.permissionStatus === 'OUT_ON_PERMISSION' && !rec.permissionInTime) {
      return {
        text: `On Permission (${rec.permissionOutTime || ''})`,
        color: 'bg-amber-100 text-amber-800 border-amber-300',
        record: rec,
      };
    }
    if (rec.status === 'Late') {
      return {
        text: `Late (${rec.checkInTime})`,
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        record: rec,
      };
    }
    return {
      text: `Present (${rec.checkInTime})`,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      record: rec,
    };
  };

  const handleToggleStatus = async (emp: Employee) => {
    const newStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
    const confirmMsg = `Are you sure you want to set ${emp.name} (${emp.employeeId}) to ${newStatus}?`;
    if (window.confirm(confirmMsg)) {
      await updateEmployee(emp.employeeId, { status: newStatus });
      loadData();
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;

    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(employees.map((e) => e.department))).filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        onOpenQRModal={() => setIsQRModalOpen(true)}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                M Technovate Solutions Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold font-mono">
                {formatDisplayDate(getCurrentDateKey())}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Innovate at every step • Enterprise Employee Attendance & Cloud Data Storage
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsFirebaseModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95"
              title="View Cloud Database Status & Sync"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate">Cloud Sync</span>
            </button>

            <button
              type="button"
              onClick={() => setIsQRModalOpen(true)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              <span className="truncate">QR Poster</span>
            </button>

            <Link
              href="/admin/attendance"
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 text-center"
            >
              <History className="w-3.5 h-3.5" />
              <span className="truncate">History</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-gradient-to-r from-[#b76e79] to-[#9e5762] hover:opacity-90 text-white rounded-xl text-xs font-bold shadow-md shadow-[#b76e79]/20 transition-all active:scale-95 text-center"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="truncate">Add Staff</span>
            </button>
          </div>
        </div>

        {cleanMessage && (
          <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-xs">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cleanMessage}</span>
          </div>
        )}

        {/* METRICS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Staff
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 sm:mt-1">{totalEmployees}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {activeEmployees} Active
              </p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600">
                Present
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-0.5 sm:mt-1">{totalPresent}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Marked today</p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-500">
                Absent
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-rose-600 mt-0.5 sm:mt-1">{absentCount}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Not marked</p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <UserX className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600">
                Late
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-600 mt-0.5 sm:mt-1">{lateRecords.length}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                After {settings?.workStartTime || '09:30 AM'}
              </p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* Office Entrance Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/20">
              <QrCode className="w-3.5 h-3.5" /> M Technovate Solutions Entrance Scanner
            </span>
            <h2 className="text-xl font-bold">Official Office Entrance QR Code</h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Display this QR code at the entrance or print the official poster. Employees scan on mobile to verify their registered face photo and record attendance.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsQRModalOpen(true)}
              className="px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              View & Print Poster
            </button>
            <Link
              href="/attendance"
              target="_blank"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
            >
              <span>Open Scanner</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* EMPLOYEE DIRECTORY & TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Registered Employees</h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                  {filteredEmployees.length} unique
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sequential auto-generated ID • Verified photo • Real-time attendance
              </p>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
              {/* Clean Duplicates Button */}
              <button
                type="button"
                onClick={handleCleanDuplicates}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                title="Verify and remove any duplicate employees"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Remove Duplicates</span>
              </button>

              {/* Search */}
              <div className="relative flex-1 sm:w-56">
                <input
                  type="text"
                  placeholder="Search by ID, name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </div>

              {/* Department Filter */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Employee ID</th>
                  <th className="py-3.5 px-4">Photo</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Today&apos;s Attendance</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading employee records...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No employees match the specified criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const todayStatus = getEmployeeTodayStatus(emp.employeeId);
                    return (
                      <tr key={emp.employeeId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6">
                          <span className="font-mono font-bold text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                            {emp.employeeId}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="relative w-10 h-10 rounded-full ring-2 ring-slate-100 overflow-hidden bg-slate-100 shadow-2xs">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={emp.photoUrl}
                              alt={emp.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">{emp.name}</div>
                          <div className="text-[11px] text-slate-400">{emp.designation}</div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">{emp.department}</td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              emp.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {emp.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${todayStatus.color}`}
                          >
                            {todayStatus.text}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setIsProfileModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Edit Employee"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(emp)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                emp.status === 'Active'
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={emp.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                            >
                              <PowerOff className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onEmployeeAdded={() => loadData()}
      />

      <EditEmployeeModal
        isOpen={isEditModalOpen}
        employee={selectedEmployee}
        onClose={() => setIsEditModalOpen(false)}
        onEmployeeUpdated={() => loadData()}
      />

      <EmployeeProfileModal
        isOpen={isProfileModalOpen}
        employee={selectedEmployee}
        onClose={() => setIsProfileModalOpen(false)}
        onEdit={(emp) => {
          setSelectedEmployee(emp);
          setIsEditModalOpen(true);
        }}
      />

      <QRCodeModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />
      <FirebaseSettingsModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        onConfigChanged={() => loadData()}
      />
    </div>
  );
}
