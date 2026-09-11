export interface Employee {
  id: string;
  employeeId: string; // MT001, MT002, etc. (Unique)
  name: string;
  photoUrl: string;
  department: string;
  designation: string;
  phone: string;
  email: string;
  joiningDate: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD
  displayDate: string; // e.g. 07 September 2026
  checkInTime: string; // e.g. 09:14 AM
  checkOutTime?: string; // e.g. 06:02 PM
  totalHours?: string; // e.g. 8h 48m
  permissionOutTime?: string; // e.g. 02:30 PM
  permissionInTime?: string; // e.g. 03:45 PM
  permissionDuration?: string; // e.g. 1h 15m
  permissionStatus?: 'NONE' | 'OUT_ON_PERMISSION' | 'RETURNED' | 'NOT_RETURNED';
  permissionReason?: string;
  status: 'Present' | 'Late' | 'Half Day';
  location?: {
    latitude: number;
    longitude: number;
    verified: boolean;
    distanceMeters?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OfficeSettings {
  officeName: string;
  officeAddress: string;
  geofenceEnabled: boolean;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  workStartTime: string; // "09:30 AM"
  workEndTime: string; // "06:00 PM"
  ownerEmail?: string;
  autoEmailReportEnabled?: boolean;
  emailReportTime?: string; // e.g. "09:35 AM"
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSenderEmail?: string;
}

export interface VerificationResult {
  success: boolean;
  type: 'CHECK_IN' | 'CHECK_OUT' | 'PERMISSION_OUT' | 'PERMISSION_IN' | 'CHOOSE_ACTION' | 'ALREADY_COMPLETED' | 'ERROR';
  message: string;
  currentStatus?: 'NOT_CHECKED_IN' | 'CHECKED_IN' | 'OUT_ON_PERMISSION' | 'COMPLETED';
  employee?: Employee;
  record?: AttendanceRecord;
}
