import type { APIRoute } from 'astro';
import sql from '../../../lib/db';
import { checkAuth } from '../../../lib/auth';

export const GET: APIRoute = async () => {
  const rows = await sql`SELECT key, value FROM site_config`;
  const config = Object.fromEntries(rows.map((r: any) => [r.key, r.value]));
  return Response.json(config);
};

export const POST: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) return new Response('Unauthorized', { status: 401 });
  const updates = await request.json() as Record<string, string>;
  for (const [key, value] of Object.entries(updates)) {
    await sql`
      INSERT INTO site_config (key, value, updated_at)
      VALUES (${key}, ${value}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = NOW()
    `;
  }
  return Response.json({ ok: true });
};
