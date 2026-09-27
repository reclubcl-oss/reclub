import type { APIRoute } from 'astro';
import { verifyMagicToken, createSession, setSessionCookie } from '../../../../lib/client-auth';

export const GET: APIRoute = async ({ request, redirect }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) return redirect('/panel/login?error=invalid');

  const clientId = await verifyMagicToken(token);
  if (!clientId) return redirect('/panel/login?error=expired');

  const sessionToken = await createSession(clientId);
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/panel',
      'Set-Cookie': setSessionCookie(sessionToken),
    },
  });
};
