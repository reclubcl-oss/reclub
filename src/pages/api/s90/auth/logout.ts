import type { APIRoute } from 'astro';
import { clearSessionCookie } from '../../../../lib/client-auth';

export const POST: APIRoute = async () => {
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/panel/login',
      'Set-Cookie': clearSessionCookie(),
    },
  });
};
