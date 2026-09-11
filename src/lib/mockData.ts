import { Employee, OfficeSettings } from '@/types';

// Clean slate: 0 employees so admin can add from scratch
export const INITIAL_EMPLOYEES: Employee[] = [];

export const INITIAL_SETTINGS: OfficeSettings = {
  officeName: 'M Technovate Solutions Headquarters',
  officeAddress: 'Tech Hub Park, Tower 4, Cyber City',
  geofenceEnabled: false,
  latitude: 12.9716,
  longitude: 77.5946,
  radiusMeters: 150,
  workStartTime: '09:30 AM',
  workEndTime: '06:00 PM',
  ownerEmail: 'mtechnovatesolutions@gmail.com',
  autoEmailReportEnabled: true,
  emailReportTime: '09:35 AM',
};
