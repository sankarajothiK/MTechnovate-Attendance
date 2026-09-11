import { NextResponse } from 'next/server';
import { getFirestoreDb } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { Employee, AttendanceRecord, OfficeSettings } from '@/types';
import { getCurrentDateKey, formatDisplayDate } from '@/lib/dateUtils';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    let customRecipient: string | undefined;
    try {
      const body = await request.json();
      customRecipient = body.recipientEmail;
    } catch {
      // no body or empty
    }

    const db = getFirestoreDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database not initialized' }, { status: 500 });
    }

    // 1. Fetch Office Settings for owner email and SMTP config
    let settings: OfficeSettings = {
      officeName: 'M Technovate Solutions',
      officeAddress: 'Tech Hub Park, Tower 4, Cyber City',
      geofenceEnabled: false,
      latitude: 12.9716,
      longitude: 77.5946,
      radiusMeters: 150,
      workStartTime: '09:30 AM',
      workEndTime: '06:00 PM',
      ownerEmail: 'mtechnovatesolutions@gmail.com', // default fallback
    };

    try {
      const setDoc = await getDoc(doc(db, 'settings', 'office'));
      if (setDoc.exists()) {
        settings = { ...settings, ...(setDoc.data() as OfficeSettings) };
      }
    } catch (e) {
      console.warn('Error fetching office settings:', e);
    }

    const recipient = customRecipient || settings.ownerEmail || 'mtechnovatesolutions@gmail.com';

    if (!recipient) {
      return NextResponse.json(
        { success: false, error: 'No owner email address configured in settings.' },
        { status: 400 }
      );
    }

    // 2. Fetch Employees & Today's Attendance
    const todayKey = getCurrentDateKey();
    const displayDate = formatDisplayDate(todayKey);

    const [empSnap, attSnap] = await Promise.all([
      getDocs(collection(db, 'employees')),
      getDocs(collection(db, 'attendance')),
    ]);

    const employees: Employee[] = [];
    empSnap.forEach((d) => {
      const data = d.data() as Employee;
      if (data && data.employeeId) employees.push(data);
    });

    const todayRecords: AttendanceRecord[] = [];
    attSnap.forEach((d) => {
      const data = d.data() as AttendanceRecord;
      if (data && data.date === todayKey) todayRecords.push(data);
    });

    // 3. Calculate Attendance Metrics
    const totalStaff = employees.length;
    const activeStaff = employees.filter((e) => e.status === 'Active');
    const presentCount = todayRecords.length;
    const lateCount = todayRecords.filter((r) => r.status === 'Late').length;
    const onPermissionCount = todayRecords.filter(
      (r) => r.permissionStatus === 'OUT_ON_PERMISSION' && !r.permissionInTime && !r.checkOutTime
    ).length;
    const absentStaff = activeStaff.filter(
      (emp) => !todayRecords.some((r) => r.employeeId.toUpperCase() === emp.employeeId.toUpperCase())
    );

    // 4. Generate HTML Email Template
    const rowsHtml = employees
      .map((emp) => {
        const rec = todayRecords.find((r) => r.employeeId.toUpperCase() === emp.employeeId.toUpperCase());
        let statusBadge = '<span style="color: #e11d48; font-weight: bold; background: #ffe4e6; padding: 3px 8px; border-radius: 6px;">Absent</span>';
        let inTime = '-';
        let outTime = '-';
        let permTime = '-';
        let duration = '-';

        if (rec) {
          inTime = rec.checkInTime || '-';
          outTime = rec.checkOutTime || '-';
          duration = rec.totalHours || '-';

          if (rec.permissionOutTime) {
            permTime = `${rec.permissionOutTime} ${rec.permissionInTime ? `→ ${rec.permissionInTime} (${rec.permissionDuration || ''})` : '(Currently Out)'}`;
          }

          if (rec.checkOutTime) {
            statusBadge = '<span style="color: #0284c7; font-weight: bold; background: #e0f2fe; padding: 3px 8px; border-radius: 6px;">Checked Out</span>';
          } else if (rec.permissionStatus === 'OUT_ON_PERMISSION' && !rec.permissionInTime) {
            statusBadge = '<span style="color: #d97706; font-weight: bold; background: #fef3c7; padding: 3px 8px; border-radius: 6px;">On Permission</span>';
          } else if (rec.status === 'Late') {
            statusBadge = '<span style="color: #d97706; font-weight: bold; background: #fef3c7; padding: 3px 8px; border-radius: 6px;">Late Present</span>';
          } else {
            statusBadge = '<span style="color: #16a34a; font-weight: bold; background: #dcfce7; padding: 3px 8px; border-radius: 6px;">Present</span>';
          }
        }

        return `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 12px; font-weight: bold; font-family: monospace; color: #334155;">${emp.employeeId}</td>
            <td style="padding: 10px 12px; font-weight: 600; color: #0f172a;">${emp.name}</td>
            <td style="padding: 10px 12px; color: #64748b; font-size: 12px;">${emp.department}</td>
            <td style="padding: 10px 12px; font-family: monospace; color: #16a34a; font-weight: bold;">${inTime}</td>
            <td style="padding: 10px 12px; font-family: monospace; color: #0284c7;">${outTime}</td>
            <td style="padding: 10px 12px; color: #d97706; font-size: 11px;">${permTime}</td>
            <td style="padding: 10px 12px; font-weight: bold; font-size: 12px;">${duration}</td>
            <td style="padding: 10px 12px; font-size: 11px;">${statusBadge}</td>
          </tr>
        `;
      })
      .join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Daily Attendance Report - ${displayDate}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #334155;">
        <div style="max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #b76e79 0%, #8e4a55 100%); padding: 24px; color: #ffffff;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: -0.5px;">M TECHNOVATE SOLUTIONS</h1>
                <p style="margin: 4px 0 0 0; font-size: 11px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Innovate at every step • Daily Attendance Summary</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; font-size: 14px; font-weight: bold;">${displayDate}</p>
                <p style="margin: 2px 0 0 0; font-size: 11px; opacity: 0.85;">Scheduled 09:35 AM Report</p>
              </div>
            </div>
          </div>

          <!-- Summary Stats -->
          <div style="padding: 20px; background: #fdf8f8; border-bottom: 1px solid #f1f5f9;">
            <table width="100%" style="border-collapse: collapse; text-align: center;">
              <tr>
                <td style="padding: 10px; width: 20%;">
                  <div style="background: #ffffff; padding: 12px 6px; border-radius: 12px; border: 1px solid #ebdcdc;">
                    <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">Total Staff</div>
                    <div style="font-size: 22px; font-weight: 900; color: #0f172a; margin-top: 2px;">${totalStaff}</div>
                  </div>
                </td>
                <td style="padding: 10px; width: 20%;">
                  <div style="background: #ffffff; padding: 12px 6px; border-radius: 12px; border: 1px solid #bbf7d0;">
                    <div style="font-size: 10px; font-weight: bold; color: #16a34a; text-transform: uppercase;">Present Today</div>
                    <div style="font-size: 22px; font-weight: 900; color: #16a34a; margin-top: 2px;">${presentCount}</div>
                  </div>
                </td>
                <td style="padding: 10px; width: 20%;">
                  <div style="background: #ffffff; padding: 12px 6px; border-radius: 12px; border: 1px solid #fde68a;">
                    <div style="font-size: 10px; font-weight: bold; color: #d97706; text-transform: uppercase;">Late Arrivals</div>
                    <div style="font-size: 22px; font-weight: 900; color: #d97706; margin-top: 2px;">${lateCount}</div>
                  </div>
                </td>
                <td style="padding: 10px; width: 20%;">
                  <div style="background: #ffffff; padding: 12px 6px; border-radius: 12px; border: 1px solid #fecdd3;">
                    <div style="font-size: 10px; font-weight: bold; color: #e11d48; text-transform: uppercase;">Absent</div>
                    <div style="font-size: 22px; font-weight: 900; color: #e11d48; margin-top: 2px;">${absentStaff.length}</div>
                  </div>
                </td>
                <td style="padding: 10px; width: 20%;">
                  <div style="background: #ffffff; padding: 12px 6px; border-radius: 12px; border: 1px solid #fed7aa;">
                    <div style="font-size: 10px; font-weight: bold; color: #ea580c; text-transform: uppercase;">On Permission</div>
                    <div style="font-size: 22px; font-weight: 900; color: #ea580c; margin-top: 2px;">${onPermissionCount}</div>
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <!-- Attendance Table -->
          <div style="padding: 20px;">
            <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
              Employee Attendance Details
            </h3>
            <table width="100%" style="border-collapse: collapse; text-align: left; font-size: 13px;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 11px; text-transform: uppercase;">
                  <th style="padding: 10px 12px;">ID</th>
                  <th style="padding: 10px 12px;">Staff Name</th>
                  <th style="padding: 10px 12px;">Department</th>
                  <th style="padding: 10px 12px;">Check-In</th>
                  <th style="padding: 10px 12px;">Check-Out</th>
                  <th style="padding: 10px 12px;">Permission</th>
                  <th style="padding: 10px 12px;">Hours</th>
                  <th style="padding: 10px 12px;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div style="padding: 16px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
            <p style="margin: 0;">Automated Attendance System • M Technovate Solutions</p>
            <p style="margin: 4px 0 0 0;">Generated on ${displayDate} via Cloud Terminal • <a href="https://mtechnovate-attendance.vercel.app/admin" style="color: #b76e79; text-decoration: none; font-weight: bold;">Open Admin Portal</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 5. Send via Transporter
    const smtpUser = settings.smtpUser || process.env.SMTP_USER || settings.ownerEmail || 'mtechnovatesolutions@gmail.com';
    const smtpPass = (settings.smtpPass || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '').trim().replace(/\s+/g, '');
    const smtpHost = settings.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = settings.smtpPort || Number(process.env.SMTP_PORT) || 465;
    const smtpSender = settings.smtpSenderEmail || process.env.SMTP_SENDER || `M Technovate Attendance <${smtpUser}>`;

    let mailSent = false;
    let mailError: string | null = null;

    if (smtpPass) {
      try {
        const isGmail = smtpHost.includes('gmail') || smtpUser.includes('@gmail.com');
        const transporterConfig = isGmail
          ? {
              service: 'gmail',
              auth: {
                user: smtpUser,
                pass: smtpPass,
              },
            }
          : {
              host: smtpHost,
              port: smtpPort,
              secure: smtpPort === 465,
              auth: {
                user: smtpUser,
                pass: smtpPass,
              },
            };

        const transporter = nodemailer.createTransport(
          transporterConfig as Parameters<typeof nodemailer.createTransport>[0]
        );

        await transporter.sendMail({
          from: smtpSender,
          to: recipient,
          subject: `[M Technovate] Daily Attendance Report - ${displayDate} (${presentCount}/${totalStaff} Present)`,
          html: emailHtml,
        });

        mailSent = true;
      } catch (err: unknown) {
        console.error('SMTP send failed:', err);
        mailError = err instanceof Error ? err.message : 'SMTP dispatch failed';
      }
    }

    if (!mailSent) {
      return NextResponse.json({
        success: false,
        mailSent: false,
        recipient,
        date: displayDate,
        metrics: {
          totalStaff,
          presentCount,
          lateCount,
          absentCount: absentStaff.length,
          onPermissionCount,
        },
        message: mailError
          ? `Email dispatch failed: ${mailError}. Please verify your Gmail App Password in Admin Settings.`
          : `Email delivery setup required: Please enter your 16-character Gmail App Password in Admin Settings to enable email delivery to ${recipient}.`,
        error: mailError || 'Missing SMTP password / Gmail App Password',
      });
    }

    return NextResponse.json({
      success: true,
      mailSent: true,
      recipient,
      date: displayDate,
      metrics: {
        totalStaff,
        presentCount,
        lateCount,
        absentCount: absentStaff.length,
        onPermissionCount,
      },
      message: `Daily attendance report successfully delivered to ${recipient} ✓`,
    });
  } catch (error: unknown) {
    console.error('Send report error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to send report' },
      { status: 500 }
    );
  }
}
