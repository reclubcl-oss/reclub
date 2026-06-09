import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
  try {
    const url = (import.meta.env.PUBLIC_SUPABASE_URL || '').trim();
    const key = (import.meta.env.SUPABASE_SERVICE_KEY || '').trim();

    if (!url || !key) {
      return new Response(JSON.stringify({ ok: false, error: 'missing env vars', url: !!url, key: !!key }), { status: 200 });
    }

    const admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await admin.auth.admin.createUser({
      email: 'benjamin.tapia.r1@gmail.com',
      password: 'Rapido12',
      email_confirm: true,
    });

    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message, code: error.code }), { status: 200 });
    }

    return new Response(JSON.stringify({ ok: true, id: data.user?.id, email: data.user?.email }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, caught: String(e) }), { status: 200 });
  }
};
