import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Employee } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getFirestoreDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Firestore not initialized' }, { status: 500 });
    }
    const snap = await getDocs(collection(db, 'employees'));
    const employees: Employee[] = [];
    snap.forEach((d) => {
      const data = d.data() as Employee;
      if (data && data.employeeId) {
        employees.push(data);
      }
    });
    // Sort by employee ID MT001, MT002...
    employees.sort((a, b) => a.employeeId.localeCompare(b.employeeId));
    return NextResponse.json({ success: true, employees });
  } catch (error: unknown) {
    console.error('API GET /api/employees error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, name, photoUrl, department, designation, phone, email, joiningDate, status } = body;

    if (!employeeId || !name) {
      return NextResponse.json({ success: false, error: 'Employee ID and Name are required' }, { status: 400 });
    }

    const cleanId = employeeId.trim().toUpperCase();
    const db = getFirestoreDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Firestore not initialized' }, { status: 500 });
    }

    // Check duplicate ID
    const snap = await getDocs(collection(db, 'employees'));
    const existing: Employee[] = [];
    snap.forEach((d) => existing.push(d.data() as Employee));

    if (existing.some((e) => e.employeeId.toUpperCase() === cleanId)) {
      return NextResponse.json(
        { success: false, error: `Employee ID ${cleanId} already exists in database.` },
        { status: 400 }
      );
    }

    const duplicateName = existing.find(
      (e) => e.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicateName) {
      return NextResponse.json(
        {
          success: false,
          error: `An employee named "${name}" already exists with ID ${duplicateName.employeeId}. Duplicate employees are not permitted.`,
        },
        { status: 400 }
      );
    }

    const newEmployee: Employee = {
      id: `emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      employeeId: cleanId,
      name: name.trim(),
      photoUrl: photoUrl || '',
      department: department || 'Development',
      designation: designation || 'Team Member',
      phone: phone || '-',
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@mtechno.com`,
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      status: status || 'Active',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'employees', cleanId), newEmployee);
    return NextResponse.json({ success: true, employee: newEmployee });
  } catch (error: unknown) {
    console.error('API POST /api/employees error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create employee' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, updates } = body;
    if (!employeeId || !updates) {
      return NextResponse.json({ success: false, error: 'Employee ID and updates required' }, { status: 400 });
    }

    const cleanId = employeeId.trim().toUpperCase();
    const db = getFirestoreDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Firestore not initialized' }, { status: 500 });
    }

    await updateDoc(doc(db, 'employees', cleanId), updates);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('API PUT /api/employees error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update employee' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Employee ID required' }, { status: 400 });
    }

    const cleanId = employeeId.trim().toUpperCase();
    const db = getFirestoreDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Firestore not initialized' }, { status: 500 });
    }

    await deleteDoc(doc(db, 'employees', cleanId));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('API DELETE /api/employees error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
