'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  User,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Camera,
  Trash2,
} from 'lucide-react';
import { getNextEmployeeId, createEmployee } from '@/lib/db';
import { Employee } from '@/types';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmployeeAdded: (employee: Employee) => void;
}

const DEPARTMENTS = [
  'Development',
  'Testing',
  'UI/UX Design',
  'Human Resources',
  'Marketing',
  'Finance & Accounts',
  'Operations',
  'Product Management',
];

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
];

export default function AddEmployeeModal({
  isOpen,
  onClose,
  onEmployeeAdded,
}: AddEmployeeModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [loadingId, setLoadingId] = useState(true);
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [department, setDepartment] = useState('Development');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [joiningDate, setJoiningDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-fetch next sequential ID whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingId(true);
      setError('');
      setName('');
      setPhotoUrl('');
      setDesignation('');
      setPhone('');
      setEmail('');
      setStatus('Active');

      getNextEmployeeId()
        .then((nextId) => {
          setEmployeeId(nextId);
        })
        .catch((err) => {
          console.error(err);
          setEmployeeId('MT001');
        })
        .finally(() => setLoadingId(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Photo File Upload with Preview
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo size should be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const rawData = reader.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 400;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            setPhotoUrl(compressed);
            setError('');
          } else {
            setPhotoUrl(rawData);
            setError('');
          }
        } catch {
          setPhotoUrl(rawData);
          setError('');
        }
      };
      img.onerror = () => {
        setPhotoUrl(rawData);
        setError('');
      };
      img.src = rawData;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation for primary required fields: Employee ID + Employee Name + Employee Photo
    if (!employeeId) {
      setError('Employee ID is required.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter Employee Name.');
      return;
    }
    if (!photoUrl) {
      setError('Please upload an Employee Photo (required for identity verification).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createEmployee({
        employeeId,
        name: name.trim(),
        photoUrl,
        department,
        designation: designation.trim() || 'Team Member',
        phone: phone.trim() || '-',
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@mtechno.com`,
        joiningDate,
        status,
      });

      if (res.success && res.employee) {
        onEmployeeAdded(res.employee);
        onClose();
      } else {
        setError(res.error || 'Failed to create employee.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto sm:my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Add New Employee</h3>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Register employee with auto-generated ID and photo verification
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="shrink-0 mx-4 sm:mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
          {/* Top Row: Auto-Generated Employee ID & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Employee ID <span className="text-blue-600 font-normal normal-case">(Auto-generated)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={loadingId ? 'Generating...' : employeeId}
                  className="w-full px-3.5 py-2.5 bg-blue-50/70 border border-blue-200 rounded-xl font-mono text-sm font-bold text-blue-900 tracking-wider select-none cursor-not-allowed"
                />
                <span className="absolute right-3 top-2.5 text-[11px] font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                  Sequential
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Generated automatically after database uniqueness check.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active (Eligible for Attendance)</option>
                <option value="Inactive">Inactive (Deactivated)</option>
              </select>
            </div>
          </div>

          {/* Employee Name (Required) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Employee Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. Naveen Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Employee Photo Upload & Preview (Required) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Employee Photo <span className="text-rose-500">*</span>
              <span className="text-slate-400 font-normal normal-case ml-1">
                (Used to verify face on office attendance screen)
              </span>
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
              {/* Photo Preview Circle */}
              <div className="relative shrink-0">
                {photoUrl ? (
                  <div className="relative w-24 h-24 rounded-full ring-4 ring-blue-500/20 overflow-hidden shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white text-xs font-medium"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-5 h-5 text-rose-300" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-200 flex flex-col items-center justify-center text-slate-400 border border-slate-300">
                    <Camera className="w-7 h-7 mb-0.5" />
                    <span className="text-[10px] font-semibold">No Photo</span>
                  </div>
                )}
              </div>

              {/* Upload Action */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo from Device</span>
                  </button>
                </div>

                {/* Quick Sample Avatars */}
                <div className="pt-1">
                  <p className="text-[11px] text-slate-500 mb-1">
                    Or select a corporate sample headshot:
                  </p>
                  <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                    {SAMPLE_AVATARS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPhotoUrl(url)}
                        className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 ${
                          photoUrl === url ? 'border-blue-600 ring-2 ring-blue-300' : 'border-white'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Sample ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Department & Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Department
              </label>
              <div className="relative">
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Designation
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Software Engineer"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Contact Details & Joining Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@mtechno.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Joining Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loadingId}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all text-center"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Create Employee</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
