import sql from './db';
import { randomBytes } from 'node:crypto';

const SESSION_COOKIE = 'reclub_s90';
const SESSION_DAYS = 30;

export interface ClientSession {
  client_id: string;
  clinic_name: string;
  contact_name: string | null;
  email: string;
  start_date: string;
  plan: 'unico' | 'cuotas';
  payment_link: string | null;
  calendar_link: string | null;
  drive_link: string | null;
}

export async function getClientSession(request: Request): Promise<ClientSession | null> {
  const cookies = request.headers.get('cookie') ?? '';
  const match = cookies.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;
  const token = match[1];
  const rows = await sql`
    SELECT s.client_id, c.clinic_name, c.contact_name, c.email, c.start_date::text,
           c.plan, c.payment_link, c.calendar_link, c.drive_link
    FROM s90_sessions s
    JOIN s90_clients c ON c.id = s.client_id
    WHERE s.token = ${token} AND s.expires_at > NOW()
    LIMIT 1
  `;
  return (rows[0] as ClientSession) ?? null;
}

export async function createMagicToken(clientId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await sql`
    INSERT INTO s90_auth_tokens (client_id, token, expires_at)
    VALUES (${clientId}, ${token}, ${expiresAt.toISOString()})
  `;
  return token;
}

export async function verifyMagicToken(token: string): Promise<string | null> {
  const rows = await sql`
    SELECT client_id FROM s90_auth_tokens
    WHERE token = ${token} AND expires_at > NOW() AND used_at IS NULL
    LIMIT 1
  `;
  if (!rows[0]) return null;
  await sql`UPDATE s90_auth_tokens SET used_at = NOW() WHERE token = ${token}`;
  return (rows[0] as any).client_id;
}

export async function createSession(clientId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sql`
    INSERT INTO s90_sessions (client_id, token, expires_at)
    VALUES (${clientId}, ${token}, ${expiresAt.toISOString()})
  `;
  return token;
}

export function setSessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 24 * 60 * 60}; Path=/`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`;
}

export function dayOfProgram(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  return Math.min(90, Math.max(1, Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1));
}

export function currentPhase(day: number): string {
  if (day <= 30) return 'Lanzar';
  if (day <= 60) return 'Optimizar';
  return 'Escalar';
}
