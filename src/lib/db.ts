import { Employee, AttendanceRecord, OfficeSettings, VerificationResult } from '@/types';
import { INITIAL_SETTINGS } from './mockData';
import {
  getCurrentDateKey,
  formatDisplayDate,
  formatTime12h,
  calculateWorkingHours,
  isLateCheckIn,
  calculateDistanceMeters,
} from './dateUtils';
import { getFirestoreDb, isFirebaseConfigured } from './firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';

const EMPLOYEES_STORAGE_KEY = 'mtechnovate_employees_v3';
const ATTENDANCE_STORAGE_KEY = 'mtechnovate_attendance_v3';
const SETTINGS_STORAGE_KEY = 'mtechnovate_settings_v3';

let memEmployees: Employee[] = [];
let memAttendance: AttendanceRecord[] = [];
let memSettings: OfficeSettings = { ...INITIAL_SETTINGS };

const FIRESTORE_TIMEOUT_MS = 6000;

/**
 * Executes a promise with an automatic timeout guard to prevent UI hanging
 */
async function runWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs = FIRESTORE_TIMEOUT_MS,
  label = 'operation'
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Firebase ${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer!);
    return result;
  } catch (err) {
    clearTimeout(timer!);
    throw err;
  }
}

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
    map.set(key, { ...emp, employeeId: key });
  }
  return Array.from(map.values()).sort((a, b) => a.employeeId.localeCompare(b.employeeId));
}

/**
 * Deduplicates attendance records by (employeeId + date)
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
  // 1. Browser client: use high-speed Next.js server API endpoint
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/employees', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.employees)) {
          const clean = deduplicateEmployees(json.employees);
          setLocalStore(EMPLOYEES_STORAGE_KEY, clean);
          memEmployees = clean;
          return clean;
        }
      }
    } catch (err) {
      console.warn('API /api/employees fetch error, falling back to direct Firebase:', err);
    }
  }

  // 2. Direct Firestore (Server-side or fallback)
  const db = getFirestoreDb();
  if (db) {
    try {
      const querySnapshot = await runWithTimeout(
        getDocs(collection(db, 'employees')),
        6000,
        'getEmployees'
      );
      const emps: Employee[] = [];
      querySnapshot.forEach((d) => {
        const data = d.data() as Employee;
        if (data && data.employeeId) {
          emps.push(data);
        }
      });
      const clean = deduplicateEmployees(emps);
      setLocalStore(EMPLOYEES_STORAGE_KEY, clean);
      memEmployees = clean;
      return clean;
    } catch (e) {
      console.warn('Firebase getEmployees failed or timed out, using local store fallback:', e);
    }
  }

  // 3. Local store fallback
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

  // 1. Browser client: call server API
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, employeeId: formattedId }),
      });
      const json = await res.json();
      if (json.success && json.employee) {
        const current = getLocalStore<Employee[]>(EMPLOYEES_STORAGE_KEY, memEmployees);
        const updated = deduplicateEmployees([...current, json.employee]);
        setLocalStore(EMPLOYEES_STORAGE_KEY, updated);
        memEmployees = updated;
        return { success: true, employee: json.employee };
      } else {
        return { success: false, error: json.error || 'Failed to create employee' };
      }
    } catch (err) {
      console.warn('API createEmployee failed, falling back to direct Firestore:', err);
    }
  }

  // 2. Direct Firestore (Server-side or fallback)
  const allEmployees = await getEmployees();
  const existingId = allEmployees.find((e) => e.employeeId.toUpperCase() === formattedId);
  if (existingId) {
    return { success: false, error: `Employee ID ${formattedId} already exists in database.` };
  }

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

  const db = getFirestoreDb();
  if (db) {
    try {
      await runWithTimeout(
        setDoc(doc(db, 'employees', newEmployee.employeeId), newEmployee),
        6000,
        'setDoc employee'
      );
      console.log('Firebase: Successfully created employee', newEmployee.employeeId);
    } catch (e) {
      console.warn('Firebase setDoc failed or timed out for employee:', e);
    }
  }

  const updated = deduplicateEmployees([...allEmployees, newEmployee]);
  setLocalStore(EMPLOYEES_STORAGE_KEY, updated);
  memEmployees = updated;

  return { success: true, employee: newEmployee };
}

export async function updateEmployee(
  employeeId: string,
  updates: Partial<Employee>
): Promise<{ success: boolean; employee?: Employee; error?: string }> {
  const cleanId = employeeId.trim().toUpperCase();

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: cleanId, updates }),
      });
      const json = await res.json();
      if (json.success) {
        const all = await getEmployees();
        const index = all.findIndex((e) => e.employeeId.toUpperCase() === cleanId);
        if (index !== -1) {
          all[index] = { ...all[index], ...updates };
          setLocalStore(EMPLOYEES_STORAGE_KEY, all);
          memEmployees = all;
          return { success: true, employee: all[index] };
        }
      }
    } catch (err) {
      console.warn('API updateEmployee error, falling back:', err);
    }
  }

  const all = await getEmployees();
  const index = all.findIndex((e) => e.employeeId.toUpperCase() === cleanId);
  if (index === -1) {
    return { success: false, error: `Employee ${cleanId} not found.` };
  }

  const updatedEmployee = { ...all[index], ...updates };
  all[index] = updatedEmployee;

  const db = getFirestoreDb();
  if (db) {
    try {
      await runWithTimeout(
        updateDoc(doc(db, 'employees', cleanId), updates),
        6000,
        'updateDoc employee'
      );
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

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/employees?employeeId=${encodeURIComponent(cleanId)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        const all = await getEmployees();
        const filtered = all.filter((e) => e.employeeId.toUpperCase() !== cleanId);
        setLocalStore(EMPLOYEES_STORAGE_KEY, filtered);
        memEmployees = filtered;
        return true;
      }
    } catch (err) {
      console.warn('API deleteEmployee error, falling back:', err);
    }
  }

  const all = await getEmployees();
  const filtered = all.filter((e) => e.employeeId.toUpperCase() !== cleanId);

  const db = getFirestoreDb();
  if (db) {
    try {
      await runWithTimeout(
        deleteDoc(doc(db, 'employees', cleanId)),
        6000,
        'deleteDoc employee'
      );
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
  // 1. Browser client: call server API
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/attendance', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.attendance)) {
          const clean = deduplicateAttendance(json.attendance);
          setLocalStore(ATTENDANCE_STORAGE_KEY, clean);
          memAttendance = clean;
          return clean;
        }
      }
    } catch (err) {
      console.warn('API /api/attendance fetch error, falling back:', err);
    }
  }

  // 2. Direct Firestore fallback
  const db = getFirestoreDb();
  if (db) {
    try {
      const snap = await runWithTimeout(
        getDocs(collection(db, 'attendance')),
        6000,
        'getAllAttendance'
      );
      const records: AttendanceRecord[] = [];
      snap.forEach((d) => {
        const data = d.data() as AttendanceRecord;
        if (data && data.employeeId && data.date) {
          records.push(data);
        }
      });
      const clean = deduplicateAttendance(records);
      setLocalStore(ATTENDANCE_STORAGE_KEY, clean);
      memAttendance = clean;
      return clean;
    } catch (e) {
      console.warn('Firebase getAllAttendance failed or timed out:', e);
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
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.settings) {
          setLocalStore(SETTINGS_STORAGE_KEY, json.settings);
          memSettings = json.settings;
          return json.settings;
        }
      }
    } catch (err) {
      console.warn('API /api/settings error, falling back:', err);
    }
  }

  const db = getFirestoreDb();
  if (db) {
    try {
      const snap = await runWithTimeout(
        getDoc(doc(db, 'settings', 'office')),
        6000,
        'getOfficeSettings'
      );
      if (snap.exists()) {
        const data = snap.data() as OfficeSettings;
        setLocalStore(SETTINGS_STORAGE_KEY, data);
        memSettings = data;
        return data;
      }
    } catch (e) {
      console.warn('Firebase getOfficeSettings failed or timed out:', e);
    }
  }
  return getLocalStore<OfficeSettings>(SETTINGS_STORAGE_KEY, memSettings);
}

export async function updateOfficeSettings(updates: Partial<OfficeSettings>): Promise<OfficeSettings> {
  const current = await getOfficeSettings();
  const updated = { ...current, ...updates };

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const json = await res.json();
      if (json.success && json.settings) {
        setLocalStore(SETTINGS_STORAGE_KEY, json.settings);
        memSettings = json.settings;
        return json.settings;
      }
    } catch (err) {
      console.warn('API updateOfficeSettings error, falling back:', err);
    }
  }

  const db = getFirestoreDb();
  if (db) {
    try {
      await runWithTimeout(
        setDoc(doc(db, 'settings', 'office'), updated),
        6000,
        'setDoc settings'
      );
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
  const db = getFirestoreDb();
  if (!db) {
    return { success: false, employeesSynced: 0, attendanceSynced: 0, error: 'Firebase is not connected or configured.' };
  }

  try {
    const emps = await getEmployees();
    const atts = await getAllAttendance();
    const setts = await getOfficeSettings();

    // 1. Sync Employees
    for (const emp of emps) {
      await runWithTimeout(
        setDoc(doc(db, 'employees', emp.employeeId), emp),
        6000,
        `sync emp ${emp.employeeId}`
      );
    }

    // 2. Sync Attendance
    for (const att of atts) {
      await runWithTimeout(
        setDoc(doc(db, 'attendance', att.id), att),
        6000,
        `sync att ${att.id}`
      );
    }

    // 3. Sync Settings
    await runWithTimeout(
      setDoc(doc(db, 'settings', 'office'), setts),
      6000,
      'sync settings'
    );

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
  userCoords?: { latitude: number; longitude: number },
  clientOptions?: { clientTime?: string; clientDateKey?: string }
): Promise<VerificationResult> {
  const cleanId = employeeIdInput.trim().toUpperCase();
  const clientTime = clientOptions?.clientTime || formatTime12h();
  const clientDateKey = clientOptions?.clientDateKey || getCurrentDateKey();

  // 1. Browser client: call server API endpoint
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: cleanId,
          userCoords,
          clientTime,
          clientDateKey,
        }),
      });
      const json = await res.json();
      if (json) {
        if (json.record) {
          const allRecords = getLocalStore<AttendanceRecord[]>(ATTENDANCE_STORAGE_KEY, memAttendance);
          const updated = deduplicateAttendance([json.record, ...allRecords]);
          setLocalStore(ATTENDANCE_STORAGE_KEY, updated);
          memAttendance = updated;
        }
        return json as VerificationResult;
      }
    } catch (err) {
      console.warn('API verifyAndMarkAttendance error, falling back to direct:', err);
    }
  }

  // 2. Direct Firestore verification fallback
  const employee = await getEmployeeByEmployeeId(cleanId);

  if (!employee) {
    return {
      success: false,
      type: 'ERROR',
      message: 'Employee Not Found. The Employee ID you entered is not registered. Please enter a valid Employee ID.',
    };
  }

  if (employee.status !== 'Active') {
    return {
      success: false,
      type: 'ERROR',
      message: 'Access Denied. This employee account is currently inactive. Please contact the administrator.',
      employee,
    };
  }

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

  const todayKey = clientDateKey || getCurrentDateKey();
  const displayDate = formatDisplayDate(todayKey);
  const currentTime = clientTime || formatTime12h();
  const existingRecord = await getTodayRecordForEmployee(employee.employeeId, todayKey);

  // CASE A: Check-In
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (locationData) {
      newRecord.location = locationData;
    }

    const db = getFirestoreDb();
    if (db) {
      try {
        const firestoreData: Record<string, unknown> = { ...newRecord };
        Object.keys(firestoreData).forEach((k) => {
          if (firestoreData[k] === undefined) delete firestoreData[k];
        });
        await runWithTimeout(
          setDoc(doc(db, 'attendance', newRecord.id), firestoreData),
          6000,
          'setDoc checkIn'
        );
      } catch (e) {
        console.warn('Firebase setDoc attendance failed:', e);
      }
    }

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

  // CASE B: Check-Out
  if (existingRecord.checkInTime && !existingRecord.checkOutTime) {
    const totalHours = calculateWorkingHours(existingRecord.checkInTime, currentTime);
    const updatedRecord: AttendanceRecord = {
      ...existingRecord,
      checkOutTime: currentTime,
      totalHours,
      updatedAt: new Date().toISOString(),
    };
    if (locationData || existingRecord.location) {
      updatedRecord.location = locationData || existingRecord.location;
    }

    const db = getFirestoreDb();
    if (db) {
      try {
        const firestoreData: Record<string, unknown> = { ...updatedRecord };
        Object.keys(firestoreData).forEach((k) => {
          if (firestoreData[k] === undefined) delete firestoreData[k];
        });
        await runWithTimeout(
          setDoc(doc(db, 'attendance', updatedRecord.id), firestoreData),
          6000,
          'setDoc checkOut'
        );
      } catch (e) {
        console.warn('Firebase update attendance checkout failed:', e);
      }
    }

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

  // CASE C: Already Completed
  return {
    success: false,
    type: 'ALREADY_COMPLETED',
    message: `You already marked your attendance today (Check-in: ${existingRecord.checkInTime}, Check-out: ${existingRecord.checkOutTime}, Total: ${existingRecord.totalHours}).`,
    employee,
    record: existingRecord,
  };
}

export { isFirebaseConfigured };
