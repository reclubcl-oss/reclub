import type { APIRoute } from 'astro';
import sql from '../../../lib/db';
import { checkAuth } from '../../../lib/auth';

export const GET: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) return new Response('Unauthorized', { status: 401 });
  const rows = await sql`SELECT * FROM portfolio_brands ORDER BY sort_order, created_at DESC`;
  return Response.json(rows);
};

export const POST: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) return new Response('Unauthorized', { status: 401 });
  const { name, website_url, logo_url } = await request.json();
  const [row] = await sql`
    INSERT INTO portfolio_brands (name, website_url, logo_url)
    VALUES (${name}, ${website_url ?? ''}, ${logo_url ?? null})
    RETURNING *
  `;
  return Response.json(row);
};

export const DELETE: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) return new Response('Unauthorized', { status: 401 });
  const { id } = await request.json();
  await sql`DELETE FROM portfolio_brands WHERE id = ${id}`;
  return Response.json({ ok: true });
};
