import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { Employee, AttendanceRecord, OfficeSettings } from '@/types';
import {
  getCurrentDateKey,
  formatDisplayDate,
  formatTime12h,
  calculateWorkingHours,
  calculatePermissionDuration,
  isLateCheckIn,
  calculateDistanceMeters,
} from '@/lib/dateUtils';
import { INITIAL_SETTINGS } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

function cleanForFirestore<T extends Record<string, unknown>>(data: T): T {
  const clean = { ...data };
  Object.keys(clean).forEach((key) => {
    if (clean[key] === undefined) {
      delete clean[key];
    }
  });
  return clean;
}

export async function GET() {
  try {
    const db = getFirestoreDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Firestore not initialized' }, { status: 500 });
    }
    const snap = await getDocs(collection(db, 'attendance'));
    const records: AttendanceRecord[] = [];
    snap.forEach((d) => {
      const data = d.data() as AttendanceRecord;
      if (data && data.employeeId && data.date) {
        records.push(data);
      }
    });
    records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ success: true, attendance: records });
  } catch (error: unknown) {
    console.error('API GET /api/attendance error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      employeeId,
      userCoords,
      clientTime,
      clientDateKey,
      action = 'AUTO', // 'CHECK_IN' | 'CHECK_OUT' | 'PERMISSION_OUT' | 'PERMISSION_IN' | 'AUTO'
      willReturnToday = true, // for permission out: true = returning later; false = leaving for the day (book checkout)
      permissionReason = '',
    } = body;

    if (!employeeId) {
      return NextResponse.json(
        { success: false, type: 'ERROR', message: 'Please enter a valid Employee ID.' },
        { status: 400 }
      );
    }

    const cleanId = employeeId.trim().toUpperCase();
    const db = getFirestoreDb();
    if (!db) {
      return NextResponse.json(
        { success: false, type: 'ERROR', message: 'Firestore database not initialized' },
        { status: 500 }
      );
    }

    // 1. Fetch employee
    const empDoc = await getDoc(doc(db, 'employees', cleanId));
    if (!empDoc.exists()) {
      return NextResponse.json({
        success: false,
        type: 'ERROR',
        message: 'Employee Not Found. The Employee ID you entered is not registered. Please enter a valid Employee ID.',
      });
    }

    const employee = empDoc.data() as Employee;

    // 2. Check if active
    if (employee.status !== 'Active') {
      return NextResponse.json({
        success: false,
        type: 'ERROR',
        message: 'Access Denied. This employee account is currently inactive. Please contact the administrator.',
        employee,
      });
    }

    // 3. Office settings & Geofencing
    let settings: OfficeSettings = { ...INITIAL_SETTINGS };
    try {
      const setDocSnap = await getDoc(doc(db, 'settings', 'office'));
      if (setDocSnap.exists()) {
        settings = setDocSnap.data() as OfficeSettings;
      }
    } catch {
      // use default
    }

    let locationData: AttendanceRecord['location'] | undefined;
    if (settings.geofenceEnabled) {
      if (!userCoords) {
        return NextResponse.json({
          success: false,
          type: 'ERROR',
          message: 'Location verification is required for M Technovate office attendance. Please allow GPS location access.',
          employee,
        });
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
        return NextResponse.json({
          success: false,
          type: 'ERROR',
          message: `Outside Office Location. You are approximately ${distance}m away. You must be within ${settings.radiusMeters}m of M Technovate office to mark attendance.`,
          employee,
        });
      }
    }

    // 4. Today's attendance - timezone-accurate (Asia/Kolkata / IST)
    const todayKey =
      typeof clientDateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(clientDateKey.trim())
        ? clientDateKey.trim()
        : getCurrentDateKey();
    const displayDate = formatDisplayDate(todayKey);
    const currentTime =
      typeof clientTime === 'string' && /^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(clientTime.trim())
        ? clientTime.trim().toUpperCase()
        : formatTime12h();
    const recordDocId = `att-${employee.employeeId}-${todayKey}`;

    const existingRecordSnap = await getDoc(doc(db, 'attendance', recordDocId));
    const existingRecord = existingRecordSnap.exists() ? (existingRecordSnap.data() as AttendanceRecord) : null;

    // CASE 1: Not checked in yet today -> MARK CHECK-IN
    if (!existingRecord) {
      const isLate = isLateCheckIn(currentTime, settings.workStartTime);
      const newRecord: AttendanceRecord = {
        id: recordDocId,
        employeeId: employee.employeeId,
        employeeName: employee.name,
        department: employee.department,
        date: todayKey,
        displayDate,
        checkInTime: currentTime,
        status: isLate ? 'Late' : 'Present',
        permissionStatus: 'NONE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (locationData) {
        newRecord.location = locationData;
      }

      await setDoc(doc(db, 'attendance', recordDocId), cleanForFirestore(newRecord as unknown as Record<string, unknown>));

      return NextResponse.json({
        success: true,
        type: 'CHECK_IN',
        currentStatus: 'CHECKED_IN',
        message: 'Attendance Marked Successfully ✓',
        employee,
        record: newRecord,
      });
    }

    // If already checked out today
    if (existingRecord.checkOutTime) {
      return NextResponse.json({
        success: false,
        type: 'ALREADY_COMPLETED',
        currentStatus: 'COMPLETED',
        message: `You already marked your attendance today (Check-in: ${existingRecord.checkInTime}, Check-out: ${existingRecord.checkOutTime}, Total: ${existingRecord.totalHours}).`,
        employee,
        record: existingRecord,
      });
    }

    // CASE 2: Employee is currently OUT ON PERMISSION
    const isOutOnPermission =
      existingRecord.permissionStatus === 'OUT_ON_PERMISSION' &&
      Boolean(existingRecord.permissionOutTime) &&
      !existingRecord.permissionInTime;

    if (isOutOnPermission) {
      // 2A. Final Check-Out without returning (or willReturnToday === false)
      if (action === 'CHECK_OUT' || willReturnToday === false) {
        const totalHours = calculateWorkingHours(existingRecord.checkInTime, currentTime);
        const updatedRecord: AttendanceRecord = {
          ...existingRecord,
          checkOutTime: currentTime,
          totalHours,
          permissionStatus: 'NOT_RETURNED',
          updatedAt: new Date().toISOString(),
        };
        if (locationData || existingRecord.location) {
          updatedRecord.location = locationData || existingRecord.location;
        }

        await setDoc(doc(db, 'attendance', recordDocId), cleanForFirestore(updatedRecord as unknown as Record<string, unknown>));

        return NextResponse.json({
          success: true,
          type: 'CHECK_OUT',
          currentStatus: 'COMPLETED',
          message: 'Check-Out (Permission Exit) Recorded Successfully ✓',
          employee,
          record: updatedRecord,
        });
      }

      // 2B. Return from Permission (Permission In)
      const permDuration = calculatePermissionDuration(existingRecord.permissionOutTime || currentTime, currentTime);
      const updatedRecord: AttendanceRecord = {
        ...existingRecord,
        permissionInTime: currentTime,
        permissionDuration: permDuration,
        permissionStatus: 'RETURNED',
        updatedAt: new Date().toISOString(),
      };
      if (locationData || existingRecord.location) {
        updatedRecord.location = locationData || existingRecord.location;
      }

      await setDoc(doc(db, 'attendance', recordDocId), cleanForFirestore(updatedRecord as unknown as Record<string, unknown>));

      return NextResponse.json({
        success: true,
        type: 'PERMISSION_IN',
        currentStatus: 'CHECKED_IN',
        message: `Permission Return Recorded Successfully ✓ (Away: ${permDuration})`,
        employee,
        record: updatedRecord,
      });
    }

    // CASE 3: Employee is IN OFFICE (Checked In, Not on active permission)
    // 3A. Permission Out requested
    if (action === 'PERMISSION_OUT') {
      // If employee won't return today -> book as Check-Out directly
      if (willReturnToday === false) {
        const totalHours = calculateWorkingHours(existingRecord.checkInTime, currentTime);
        const updatedRecord: AttendanceRecord = {
          ...existingRecord,
          checkOutTime: currentTime,
          totalHours,
          permissionOutTime: currentTime,
          permissionStatus: 'NOT_RETURNED',
          permissionReason: permissionReason || 'Early Exit / Permission',
          updatedAt: new Date().toISOString(),
        };
        if (locationData || existingRecord.location) {
          updatedRecord.location = locationData || existingRecord.location;
        }

        await setDoc(doc(db, 'attendance', recordDocId), cleanForFirestore(updatedRecord as unknown as Record<string, unknown>));

        return NextResponse.json({
          success: true,
          type: 'CHECK_OUT',
          currentStatus: 'COMPLETED',
          message: 'Check-Out Recorded Successfully (Not Returning Today) ✓',
          employee,
          record: updatedRecord,
        });
      }

      // Record Permission Out (will return today)
      const updatedRecord: AttendanceRecord = {
        ...existingRecord,
        permissionOutTime: currentTime,
        permissionStatus: 'OUT_ON_PERMISSION',
        permissionReason: permissionReason || 'Permission / Gate Pass',
        updatedAt: new Date().toISOString(),
      };
      if (locationData || existingRecord.location) {
        updatedRecord.location = locationData || existingRecord.location;
      }

      await setDoc(doc(db, 'attendance', recordDocId), cleanForFirestore(updatedRecord as unknown as Record<string, unknown>));

      return NextResponse.json({
        success: true,
        type: 'PERMISSION_OUT',
        currentStatus: 'OUT_ON_PERMISSION',
        message: 'Permission Out Recorded Successfully ✓ (Gate Pass Active)',
        employee,
        record: updatedRecord,
      });
    }

    // 3B. Check-Out requested (or AUTO default)
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

    await setDoc(doc(db, 'attendance', recordDocId), cleanForFirestore(updatedRecord as unknown as Record<string, unknown>));

    return NextResponse.json({
      success: true,
      type: 'CHECK_OUT',
      currentStatus: 'COMPLETED',
      message: 'Check-Out Recorded Successfully ✓',
      employee,
      record: updatedRecord,
    });
  } catch (error: unknown) {
    console.error('API POST /api/attendance error:', error);
    return NextResponse.json(
      { success: false, type: 'ERROR', message: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
