export const prerender = false;

import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  // Verify business user session
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return json({ error: 'No autorizado' }, 401);

  const userClient = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: 'Sesión inválida' }, 401);

  let body: { qrToken?: string; businessId?: string; amount?: number };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { qrToken, businessId, amount = 1 } = body;
  if (!qrToken || !businessId) return json({ error: 'qrToken y businessId son requeridos' }, 400);

  // Find card and verify business ownership
  const { data: card } = await supabaseAdmin
    .from('loyalty_cards')
    .select('*, business:businesses(*)')
    .eq('qr_token', qrToken)
    .eq('business_id', businessId)
    .single();

  if (!card) return json({ error: 'Tarjeta no encontrada' }, 404);
  if (card.business.owner_id !== user.id) return json({ error: 'Acceso denegado' }, 403);

  const isStamps = card.business.loyalty_type === 'stamps';
  const field = isStamps ? 'stamps' : 'points';
  const newValue = (isStamps ? card.stamps : card.points) + amount;

  // Update card
  await supabaseAdmin
    .from('loyalty_cards')
    .update({ [field]: newValue })
    .eq('id', card.id);

  // Log transaction
  await supabaseAdmin.from('transactions').insert({
    card_id: card.id,
    type: isStamps ? 'stamp' : 'points',
    amount,
    scanned_by: user.id,
  });

  return json({ success: true, [field]: newValue });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
