import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// Endpoint temporal para crear/verificar usuario admin — ELIMINAR después de usar
export const GET: APIRoute = async () => {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SERVICE_KEY;

  // Primero intentar login para ver si ya existe
  const anonClient = createClient(url, import.meta.env.PUBLIC_SUPABASE_ANON_KEY);
  const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
    email: 'benjamin.tapia.r1@gmail.com',
    password: 'Rapido12',
  });

  if (!loginError && loginData.user) {
    return new Response(JSON.stringify({ ok: true, status: 'already_exists', id: loginData.user.id }), { status: 200 });
  }

  // Si no existe, crear
  const adminClient = createClient(url, key);
  const { data, error } = await adminClient.auth.admin.createUser({
    email: 'benjamin.tapia.r1@gmail.com',
    password: 'Rapido12',
    email_confirm: true,
  });

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message, loginErr: loginError?.message }), { status: 200 });
  }

  return new Response(JSON.stringify({ ok: true, status: 'created', id: data.user?.id }), { status: 200 });
};
