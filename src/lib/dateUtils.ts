/**
 * Date and time formatting helpers for M Techno attendance system
 * Standardized to Indian Standard Time (Asia/Kolkata, UTC+5:30)
 */

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export function getCurrentDateKey(d: Date | string = new Date(), timeZone = DEFAULT_TIMEZONE): string {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(dateObj);

    const year = parts.find((p) => p.type === 'year')?.value || '2026';
    const month = parts.find((p) => p.type === 'month')?.value || '01';
    const day = parts.find((p) => p.type === 'day')?.value || '01';
    return `${year}-${month}-${day}`;
  } catch {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export function formatDisplayDate(dateStrOrObj: string | Date, timeZone = DEFAULT_TIMEZONE): string {
  try {
    let d: Date;
    if (typeof dateStrOrObj === 'string') {
      const parts = dateStrOrObj.split('-');
      if (parts.length === 3) {
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0);
      } else {
        d = new Date(dateStrOrObj);
      }
    } else {
      d = dateStrOrObj;
    }

    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).formatToParts(d);

    const day = parts.find((p) => p.type === 'day')?.value || '01';
    const month = parts.find((p) => p.type === 'month')?.value || '';
    const year = parts.find((p) => p.type === 'year')?.value || '2026';
    return `${day} ${month} ${year}`;
  } catch {
    return String(dateStrOrObj);
  }
}

export function formatTime12h(date: Date | string = new Date(), timeZone = DEFAULT_TIMEZONE): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).formatToParts(dateObj);

    const hour = (parts.find((p) => p.type === 'hour')?.value || '12').padStart(2, '0');
    const minute = (parts.find((p) => p.type === 'minute')?.value || '00').padStart(2, '0');
    const dayPeriod = (parts.find((p) => p.type === 'dayPeriod')?.value || 'AM').toUpperCase();
    return `${hour}:${minute} ${dayPeriod}`;
  } catch {
    const d = typeof date === 'string' ? new Date(date) : date;
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    const formattedHours = String(hours).padStart(2, '0');
    return `${formattedHours}:${minutes} ${ampm}`;
  }
}

export function parseTimeMinutes(timeStr: string): number {
  try {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3]?.toUpperCase();

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
  } catch {
    return 0;
  }
}

export function calculateWorkingHours(checkIn: string, checkOut: string): string {
  try {
    const inMinutes = parseTimeMinutes(checkIn);
    const outMinutes = parseTimeMinutes(checkOut);
    let diff = outMinutes - inMinutes;
    if (diff < 0) diff += 24 * 60; // Cross-midnight edge case

    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins}m`;
  } catch {
    return '0h 0m';
  }
}

export function calculatePermissionDuration(outTime: string, inTime: string): string {
  try {
    const outMinutes = parseTimeMinutes(outTime);
    const inMinutes = parseTimeMinutes(inTime);
    let diff = inMinutes - outMinutes;
    if (diff < 0) diff += 24 * 60;

    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  } catch {
    return '0m';
  }
}

export function isLateCheckIn(checkInTime: string, startTimeThreshold = '09:30 AM'): boolean {
  const checkInMin = parseTimeMinutes(checkInTime);
  const thresholdMin = parseTimeMinutes(startTimeThreshold);
  return checkInMin > thresholdMin;
}

/**
 * Calculates distance between two GPS coordinates in meters (Haversine formula)
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}
