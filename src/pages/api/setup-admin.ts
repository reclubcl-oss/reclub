import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';

// Endpoint temporal para crear usuario admin — ELIMINAR después de usar
export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'benjamin.tapia.r1@gmail.com',
      password: 'Rapido12',
      email_confirm: true,
    });

    if (error) {
      // Si ya existe, actualizar contraseña
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      const existing = list?.users?.find((u: any) => u.email === 'benjamin.tapia.r1@gmail.com');
      if (existing) {
        const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(existing.id, { password: 'Rapido12' });
        return new Response(JSON.stringify({ ok: !updErr, status: 'updated', id: existing.id, updErr: updErr?.message }), { status: 200 });
      }
      return new Response(JSON.stringify({ ok: false, error: error.message, code: error.code }), { status: 200 });
    }

    return new Response(JSON.stringify({ ok: true, status: 'created', id: data.user?.id }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, caught: err?.message }), { status: 200 });
  }
};
