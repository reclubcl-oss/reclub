import { createHash } from 'node:crypto';

const COOKIE = 'reclub_admin';

function hash(password: string) {
  return createHash('sha256').update(password + 'reclub2026').digest('hex');
}

export function checkAuth(request: Request): boolean {
  const password = import.meta.env.ADMIN_PASSWORD as string;
  if (!password) return false;
  const cookies = request.headers.get('cookie') ?? '';
  const match = cookies.match(new RegExp(`${COOKIE}=([^;]+)`));
  if (!match) return false;
  return match[1] === hash(password);
}

export function setAuthCookie(): string {
  const password = import.meta.env.ADMIN_PASSWORD as string;
  const token = hash(password);
  return `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}; Path=/`;
}

export function clearAuthCookie(): string {
  return `${COOKIE}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`;
}
