import type { APIRoute } from 'astro';
import sql from '../../../lib/db';
import { checkAuth } from '../../../lib/auth';

export const GET: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) return new Response('Unauthorized', { status: 401 });
  const rows = await sql`SELECT * FROM portfolio_videos ORDER BY sort_order, created_at DESC`;
  return Response.json(rows);
};

export const POST: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) return new Response('Unauthorized', { status: 401 });
  const { title, description, category, video_url, thumbnail_url } = await request.json();
  const [row] = await sql`
    INSERT INTO portfolio_videos (title, description, category, video_url, thumbnail_url)
    VALUES (${title}, ${description ?? ''}, ${category ?? 'general'}, ${video_url}, ${thumbnail_url ?? null})
    RETURNING *
  `;
  return Response.json(row);
};

export const PATCH: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) return new Response('Unauthorized', { status: 401 });
  const { id, thumbnail_url } = await request.json();
  const [row] = await sql`
    UPDATE portfolio_videos SET thumbnail_url = ${thumbnail_url} WHERE id = ${id} RETURNING *
  `;
  return Response.json(row);
};

export const DELETE: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) return new Response('Unauthorized', { status: 401 });
  const { id } = await request.json();
  await sql`DELETE FROM portfolio_videos WHERE id = ${id}`;
  return Response.json({ ok: true });
};
