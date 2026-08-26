import type { APIRoute } from 'astro';
import { setAuthCookie } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  const { password } = await request.json();
  const expected = import.meta.env.ADMIN_PASSWORD as string;

  if (!expected || password !== expected) {
    return Response.json({ error: 'Contraseña incorrecta' }, { status: 401 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': setAuthCookie(),
    },
  });
};
