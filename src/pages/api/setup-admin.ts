import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'benjamin.tapia.r1@gmail.com',
      password: 'Rapido12',
      email_confirm: true,
    });

    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message, code: error.code }), { status: 200 });
    }

    return new Response(JSON.stringify({ ok: true, created: true, id: data.user?.id, email: data.user?.email }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, caught: String(e) }), { status: 200 });
  }
};
