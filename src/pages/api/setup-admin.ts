import type { APIRoute } from 'astro';

// Endpoint temporal para crear usuario admin — ELIMINAR después de usar
export const GET: APIRoute = async () => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = import.meta.env.SUPABASE_SERVICE_KEY;

  // Test básico de conectividad
  try {
    const healthRes = await fetch(`${supabaseUrl}/rest/v1/`, { headers: { 'apikey': serviceKey } });
    const healthText = await healthRes.text();
    if (!healthRes.ok) {
      return new Response(JSON.stringify({ ok: false, step: 'health_check', status: healthRes.status, body: healthText.slice(0, 200) }), { status: 200 });
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, step: 'health_check_catch', error: e?.message }), { status: 200 });
  }

  try {
    // Crear usuario vía API REST directa
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'benjamin.tapia.r1@gmail.com',
        password: 'Rapido12',
        email_confirm: true,
      }),
    });

    const json = await res.json();

    // Si ya existe, intentar login para confirmar
    if (json.code === 'email_exists' || json.msg?.includes('already')) {
      return new Response(JSON.stringify({ ok: true, status: 'already_exists' }), { status: 200 });
    }

    return new Response(JSON.stringify({ ok: res.ok, status: res.status, data: json }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, caught: err?.message, url: supabaseUrl }), { status: 200 });
  }
};
