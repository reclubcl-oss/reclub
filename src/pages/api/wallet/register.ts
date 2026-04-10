export const prerender = false;

import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  let body: { phone?: string; email?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { phone, email, name } = body;
  if (!phone || !email) return json({ error: 'phone y email son requeridos' }, 400);

  // Find or create client
  const { data: existing } = await supabaseAdmin
    .from('clients')
    .select('*')
    .or(`phone.eq.${phone},email.eq.${email}`)
    .maybeSingle();

  let client = existing;

  if (!client) {
    const { data, error } = await supabaseAdmin
      .from('clients')
      .insert({ phone, email, name: name || null })
      .select()
      .single();
    if (error) return json({ error: error.message }, 500);
    client = data;
  }

  // Fetch all cards for this client with business info
  const { data: cards } = await supabaseAdmin
    .from('loyalty_cards')
    .select('*, business:businesses(*)')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false });

  return json({ client, cards: cards ?? [] });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
