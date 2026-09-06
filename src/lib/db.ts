import { Employee, AttendanceRecord, OfficeSettings, VerificationResult } from '@/types';
import { INITIAL_EMPLOYEES, INITIAL_SETTINGS } from './mockData';
import {
  getCurrentDateKey,
  formatDisplayDate,
  formatTime12h,
  calculateWorkingHours,
  isLateCheckIn,
  calculateDistanceMeters,
} from './dateUtils';
import { db, isFirebaseConfigured } from './firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  writeBatch,
} from 'firebase/firestore';

const EMPLOYEES_STORAGE_KEY = 'mtechnovate_employees_v3';
const ATTENDANCE_STORAGE_KEY = 'mtechnovate_attendance_v3';
const SETTINGS_STORAGE_KEY = 'mtechnovate_settings_v3';

function generateInitialAttendance(): AttendanceRecord[] {
  return [];
}

let memEmployees: Employee[] = [];
let memAttendance: AttendanceRecord[] = [];
let memSettings: OfficeSettings = { ...INITIAL_SETTINGS };

function getLocalStore<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultVal;
  }
}

function setLocalStore<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

/**
 * Deduplicates employee records by employeeId (case-insensitive)
 * Retains the latest version of each unique employee.
 */
export function deduplicateEmployees(rawList: Employee[]): Employee[] {
  const map = new Map<string, Employee>();
  for (const emp of rawList) {
    if (!emp || !emp.employeeId) continue;
    const key = emp.employeeId.trim().toUpperCase();
    // Later occurrences overwrite earlier ones (or preserve valid data)
    map.set(key, { ...emp, employeeId: key });
  }
  return Array.from(map.values()).sort((a, b) => a.employeeId.localeCompare(b.employeeId));
}

/**
 * Deduplicates attendance records by id or (employeeId + date)
 */
export function deduplicateAttendance(rawList: AttendanceRecord[]): AttendanceRecord[] {
  const map = new Map<string, AttendanceRecord>();
  for (const rec of rawList) {
    if (!rec || !rec.employeeId || !rec.date) continue;
    const key = `${rec.employeeId.trim().toUpperCase()}_${rec.date}`;
    map.set(key, rec);
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// --- EMPLOYEE OPERATIONS ---

export async function getEmployees(): Promise<Employee[]> {
  // 1. If Firebase Firestore is configured
  if (isFirebaseConfigured() && db) {
    try {
      const querySnapshot = await getDocs(collection(db, 'employees'));
      const emps: Employee[] = [];
      querySnapshot.forEach((d) => emps.push(d.data() as Employee));
      const clean = deduplicateEmployees(emps);
      setLocalStore(EMPLOYEES_STORAGE_KEY, clean);
      memEmployees = clean;
      return clean;
    } catch (e) {
      console.warn('Firebase getEmployees failed, using local store:', e);
    }
  }

  // 2. Local store fallback
  const raw = getLocalStore<Employee[]>(EMPLOYEES_STORAGE_KEY, memEmployees);
  const clean = deduplicateEmployees(raw);

  if (clean.length !== raw.length) {
    setLocalStore(EMPLOYEES_STORAGE_KEY, clean);
  }

  memEmployees = clean;
  return clean;
}

export async function getEmployeeByEmployeeId(empId: string): Promise<Employee | null> {
  const cleanId = empId.trim().toUpperCase();
  const all = await getEmployees();
  return all.find((e) => e.employeeId.toUpperCase() === cleanId) || null;
}

/**
 * Automatically computes the next sequential Employee ID:
 * MT001 -> MT002 -> MT003...
 * Checks database to prevent duplicate IDs.
 */
export async function getNextEmployeeId(): Promise<string> {
  const employees = await getEmployees();
  let maxNumber = 0;

  for (const emp of employees) {
    const match = emp.employeeId.match(/^MT(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  const nextNum = maxNumber + 1;
  const padded = String(nextNum).padStart(3, '0');
  return `MT${padded}`;
}

export async function createEmployee(
  data: Omit<Employee, 'id' | 'createdAt'>
): Promise<{ success: boolean; employee?: Employee; error?: string }> {
  const formattedId = data.employeeId.trim().toUpperCase();

  // Strict check 1: Duplicate Employee ID
  const existingId = await getEmployeeByEmployeeId(formattedId);
  if (existingId) {
    return { success: false, error: `Employee ID ${formattedId} already exists in database.` };
  }

  // Strict check 2: Duplicate Employee Name
  const allEmployees = await getEmployees();
  const duplicateName = allEmployees.find(
    (e) => e.name.trim().toLowerCase() === data.name.trim().toLowerCase()
  );
  if (duplicateName) {
    return {
      success: false,
      error: `An employee named "${data.name}" already exists with ID ${duplicateName.employeeId}. Duplicate employees are not permitted.`,
    };
  }

  const newEmployee: Employee = {
    ...data,
    id: `emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    employeeId: formattedId,
    createdAt: new Date().toISOString(),
  };

  // 1. Firebase Firestore
  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'employees', newEmployee.employeeId), newEmployee);
    } catch (e) {
      console.warn('Firebase setDoc failed for employee:', e);
    }
  }

  // 2. Local Store
  const current = await getEmployees();
  const updated = deduplicateEmployees([...current, newEmployee]);
  setLocalStore(EMPLOYEES_STORAGE_KEY, updated);
  memEmployees = updated;

  return { success: true, employee: newEmployee };
}

export async function updateEmployee(
  employeeId: string,
  updates: Partial<Employee>
): Promise<{ success: boolean; employee?: Employee; error?: string }> {
  const cleanId = employeeId.trim().toUpperCase();
  const all = await getEmployees();
  const index = all.findIndex((e) => e.employeeId.toUpperCase() === cleanId);
  if (index === -1) {
    return { success: false, error: `Employee ${cleanId} not found.` };
  }

  const updatedEmployee = { ...all[index], ...updates };
  all[index] = updatedEmployee;

  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'employees', cleanId), updates);
    } catch (e) {
      console.warn('Firebase updateDoc failed:', e);
    }
  }

  const clean = deduplicateEmployees(all);
  setLocalStore(EMPLOYEES_STORAGE_KEY, clean);
  memEmployees = clean;

  return { success: true, employee: updatedEmployee };
}

export async function deleteEmployee(employeeId: string): Promise<boolean> {
  const cleanId = employeeId.trim().toUpperCase();
  const all = await getEmployees();
  const filtered = all.filter((e) => e.employeeId.toUpperCase() !== cleanId);

  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, 'employees', cleanId));
    } catch (e) {
      console.warn('Firebase deleteDoc failed:', e);
    }
  }

  setLocalStore(EMPLOYEES_STORAGE_KEY, filtered);
  memEmployees = filtered;
  return true;
}

/**
 * Manually cleans and removes any duplicate employees and duplicate attendance
 */
export async function cleanAllDuplicates(): Promise<{ employeeCount: number; removedCount: number }> {
  const raw = getLocalStore<Employee[]>(EMPLOYEES_STORAGE_KEY, memEmployees);
  const initialLength = raw.length;
  const clean = deduplicateEmployees(raw);
  const removed = initialLength - clean.length;

  setLocalStore(EMPLOYEES_STORAGE_KEY, clean);
  memEmployees = clean;

  // Clean attendance duplicates too
  const rawAtt = getLocalStore<AttendanceRecord[]>(ATTENDANCE_STORAGE_KEY, memAttendance);
  const cleanAtt = deduplicateAttendance(rawAtt);
  setLocalStore(ATTENDANCE_STORAGE_KEY, cleanAtt);
  memAttendance = cleanAtt;

  return { employeeCount: clean.length, removedCount: removed };
}

// --- ATTENDANCE MANAGEMENT ---

export async function getAllAttendance(): Promise<AttendanceRecord[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, 'attendance'));
      const records: AttendanceRecord[] = [];
      snap.forEach((d) => records.push(d.data() as AttendanceRecord));
      const clean = deduplicateAttendance(records);
      setLocalStore(ATTENDANCE_STORAGE_KEY, clean);
      memAttendance = clean;
      return clean;
    } catch (e) {
      console.warn('Firebase getAllAttendance failed:', e);
    }
  }

  const records = getLocalStore<AttendanceRecord[]>(ATTENDANCE_STORAGE_KEY, memAttendance);
  return deduplicateAttendance(records);
}

export async function getTodayAttendance(dateKey = getCurrentDateKey()): Promise<AttendanceRecord[]> {
  const all = await getAllAttendance();
  return all.filter((r) => r.date === dateKey);
}

export async function getEmployeeAttendance(employeeId: string): Promise<AttendanceRecord[]> {
  const cleanId = employeeId.trim().toUpperCase();
  const all = await getAllAttendance();
  return all.filter((r) => r.employeeId.toUpperCase() === cleanId);
}

export async function getTodayRecordForEmployee(
  employeeId: string,
  dateKey = getCurrentDateKey()
): Promise<AttendanceRecord | null> {
  const cleanId = employeeId.trim().toUpperCase();
  const todayRecords = await getTodayAttendance(dateKey);
  return todayRecords.find((r) => r.employeeId.toUpperCase() === cleanId) || null;
}

// --- OFFICE SETTINGS ---

export async function getOfficeSettings(): Promise<OfficeSettings> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDoc(doc(db, 'settings', 'office'));
      if (snap.exists()) {
        return snap.data() as OfficeSettings;
      }
    } catch (e) {
      console.warn('Firebase getOfficeSettings failed:', e);
    }
  }
  return getLocalStore<OfficeSettings>(SETTINGS_STORAGE_KEY, memSettings);
}

export async function updateOfficeSettings(updates: Partial<OfficeSettings>): Promise<OfficeSettings> {
  const current = await getOfficeSettings();
  const updated = { ...current, ...updates };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'settings', 'office'), updated);
    } catch (e) {
      console.warn('Firebase setDoc failed for settings:', e);
    }
  }

  setLocalStore(SETTINGS_STORAGE_KEY, updated);
  memSettings = updated;
  return updated;
}

// --- SYNC TO FIREBASE (1-CLICK SYNC ALL DATA) ---

export async function syncAllToFirebase(): Promise<{ success: boolean; employeesSynced: number; attendanceSynced: number; error?: string }> {
  if (!isFirebaseConfigured() || !db) {
    return { success: false, employeesSynced: 0, attendanceSynced: 0, error: 'Firebase is not connected or configured.' };
  }

  try {
    const emps = await getEmployees();
    const atts = await getAllAttendance();
    const setts = await getOfficeSettings();

    // 1. Sync Employees
    for (const emp of emps) {
      await setDoc(doc(db, 'employees', emp.employeeId), emp);
    }

    // 2. Sync Attendance
    for (const att of atts) {
      await setDoc(doc(db, 'attendance', att.id), att);
    }

    // 3. Sync Settings
    await setDoc(doc(db, 'settings', 'office'), setts);

    return {
      success: true,
      employeesSynced: emps.length,
      attendanceSynced: atts.length,
    };
  } catch (err: unknown) {
    console.error('Failed to sync to Firebase:', err);
    return {
      success: false,
      employeesSynced: 0,
      attendanceSynced: 0,
      error: err instanceof Error ? err.message : 'Unknown error during Firebase synchronization.',
    };
  }
}

// --- ATTENDANCE VERIFICATION FLOW ---

export async function verifyAndMarkAttendance(
  employeeIdInput: string,
  userCoords?: { latitude: number; longitude: number }
): Promise<VerificationResult> {
  const cleanId = employeeIdInput.trim().toUpperCase();

  // 1. Search employee in DB
  const employee = await getEmployeeByEmployeeId(cleanId);

  if (!employee) {
    return {
      success: false,
      type: 'ERROR',
      message: 'Employee Not Found. The Employee ID you entered is not registered. Please enter a valid Employee ID.',
    };
  }

  // 2. Check if employee is inactive
  if (employee.status !== 'Active') {
    return {
      success: false,
      type: 'ERROR',
      message: 'Access Denied. This employee account is currently inactive. Please contact the administrator.',
      employee,
    };
  }

  // 3. Check Geofencing if enabled
  const settings = await getOfficeSettings();
  let locationData: AttendanceRecord['location'] | undefined;

  if (settings.geofenceEnabled) {
    if (!userCoords) {
      return {
        success: false,
        type: 'ERROR',
        message: 'Location verification is required for M Technovate office attendance. Please allow GPS location access.',
        employee,
      };
    }

    const distance = calculateDistanceMeters(
      userCoords.latitude,
      userCoords.longitude,
      settings.latitude,
      settings.longitude
    );

    locationData = {
      latitude: userCoords.latitude,
      longitude: userCoords.longitude,
      verified: distance <= settings.radiusMeters,
      distanceMeters: distance,
    };

    if (distance > settings.radiusMeters) {
      return {
        success: false,
        type: 'ERROR',
        message: `Outside Office Location. You are approximately ${distance}m away. You must be within ${settings.radiusMeters}m of M Technovate office to mark attendance.`,
        employee,
      };
    }
  }

  // 4. Check today's existing attendance
  const todayKey = getCurrentDateKey();
  const displayDate = formatDisplayDate(todayKey);
  const currentTime = formatTime12h();
  const existingRecord = await getTodayRecordForEmployee(employee.employeeId, todayKey);

  // CASE A: Not checked in yet today -> MARK CHECK-IN
  if (!existingRecord) {
    const isLate = isLateCheckIn(currentTime, settings.workStartTime);
    const newRecord: AttendanceRecord = {
      id: `att-${employee.employeeId}-${todayKey}`,
      employeeId: employee.employeeId,
      employeeName: employee.name,
      department: employee.department,
      date: todayKey,
      displayDate,
      checkInTime: currentTime,
      status: isLate ? 'Late' : 'Present',
      location: locationData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to Firebase
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'attendance', newRecord.id), newRecord);
      } catch (e) {
        console.warn('Firebase setDoc attendance failed:', e);
      }
    }

    // Save to Local Store
    const allRecords = getLocalStore<AttendanceRecord[]>(ATTENDANCE_STORAGE_KEY, memAttendance);
    const updated = deduplicateAttendance([newRecord, ...allRecords]);
    setLocalStore(ATTENDANCE_STORAGE_KEY, updated);
    memAttendance = updated;

    return {
      success: true,
      type: 'CHECK_IN',
      message: 'Attendance Marked Successfully ✓',
      employee,
      record: newRecord,
    };
  }

  // CASE B: Checked in today, but not checked out -> MARK CHECK-OUT
  if (existingRecord.checkInTime && !existingRecord.checkOutTime) {
    const totalHours = calculateWorkingHours(existingRecord.checkInTime, currentTime);
    const updatedRecord: AttendanceRecord = {
      ...existingRecord,
      checkOutTime: currentTime,
      totalHours,
      location: locationData || existingRecord.location,
      updatedAt: new Date().toISOString(),
    };

    // Update Firebase
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'attendance', updatedRecord.id), updatedRecord);
      } catch (e) {
        console.warn('Firebase update attendance checkout failed:', e);
      }
    }

    // Update Local Store
    const allRecords = getLocalStore<AttendanceRecord[]>(ATTENDANCE_STORAGE_KEY, memAttendance);
    const updated = allRecords.map((r) => (r.id === updatedRecord.id ? updatedRecord : r));
    setLocalStore(ATTENDANCE_STORAGE_KEY, updated);
    memAttendance = updated;

    return {
      success: true,
      type: 'CHECK_OUT',
      message: 'Check-Out Recorded Successfully ✓',
      employee,
      record: updatedRecord,
    };
  }

  // CASE C: Already checked in and checked out today
  return {
    success: false,
    type: 'ALREADY_COMPLETED',
    message: `You already marked your attendance today (Check-in: ${existingRecord.checkInTime}, Check-out: ${existingRecord.checkOutTime}, Total: ${existingRecord.totalHours}).`,
    employee,
    record: existingRecord,
  };
}
