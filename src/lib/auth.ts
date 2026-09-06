'use client';

const ADMIN_SESSION_KEY = 'mtechno_admin_session';

export interface AdminUser {
  email: string;
  role: 'admin';
  name: string;
}

export const DEFAULT_ADMIN = {
  email: 'admin@mtechno.com',
  password: 'admin123',
  name: 'M Techno Administrator',
};

export function getStoredAdmin(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const session = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!session) return null;
    return JSON.parse(session);
  } catch {
    return null;
  }
}

export function loginAdmin(email: string, pass: string): { success: boolean; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === DEFAULT_ADMIN.email.toLowerCase() && pass === DEFAULT_ADMIN.password) {
    const user: AdminUser = {
      email: cleanEmail,
      role: 'admin',
      name: DEFAULT_ADMIN.name,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
    }
    return { success: true };
  }
  return { success: false, error: 'Invalid admin email or password.' };
}

export function logoutAdmin(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
}
