export const prerender = false;

import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase';

export const GET: APIRoute = async ({ params }) => {
  const { qrToken } = params;

  const { data, error } = await supabaseAdmin
    .from('loyalty_cards')
    .select('*, client:clients(*), business:businesses(*)')
    .eq('qr_token', qrToken)
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'Tarjeta no encontrada' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};
