import type { APIRoute } from 'astro';
import { checkAuth } from '../../../../lib/auth';
import { put } from '@vercel/blob';

export const POST: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) return new Response('Unauthorized', { status: 401 });
  const form = await request.formData();
  const file = form.get('file') as File;
  const clientId = form.get('client_id') as string;
  if (!file || !clientId) return Response.json({ error: 'Faltan datos' }, { status: 400 });
  const blob = await put(`s90/docs/${clientId}/${Date.now()}-${file.name}`, file, { access: 'public' });
  return Response.json({ url: blob.url });
};
