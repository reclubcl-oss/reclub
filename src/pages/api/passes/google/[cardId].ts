export const prerender = false;

import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase';

export const GET: APIRoute = async ({ params }) => {
  const { cardId } = params;

  if (!import.meta.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return new Response(
      JSON.stringify({
        error: 'Google Wallet aún no está configurado. Contacta a ReClub para activarlo.',
        configured: false,
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { data: card } = await supabaseAdmin
    .from('loyalty_cards')
    .select('*, business:businesses(*), client:clients(*)')
    .eq('id', cardId)
    .single();

  if (!card) return new Response('Not found', { status: 404 });

  const { default: jwt } = await import('jsonwebtoken');

  const business = card.business;
  const isStamps = business.loyalty_type === 'stamps';
  const issuerId = import.meta.env.GOOGLE_WALLET_ISSUER_ID;
  const classId = `${issuerId}.reclub_${business.slug}`;
  const objectId = `${issuerId}.card_${card.id.replace(/-/g, '_')}`;

  const loyaltyObject = {
    id: objectId,
    classId,
    state: 'ACTIVE',
    accountId: card.client.phone,
    accountName: card.client.name || card.client.phone,
    loyaltyPoints: {
      label: isStamps ? 'Sellos' : 'Puntos',
      balance: {
        string: isStamps
          ? `${card.stamps} / ${business.stamps_total}`
          : String(card.points),
      },
    },
    textModulesData: [
      {
        header: 'Premio',
        body: business.reward_description || 'Consulta en tienda',
        id: 'reward',
      },
      {
        header: 'Powered by',
        body: 'ReClub — reclub.cl',
        id: 'powered_by',
      },
    ],
    barcode: {
      type: 'QR_CODE',
      value: card.qr_token,
      alternateText: card.client.phone,
    },
  };

  const serviceKey = JSON.parse(import.meta.env.GOOGLE_SERVICE_ACCOUNT_KEY);

  const payload = {
    iss: import.meta.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    aud: 'google',
    origins: ['https://reclub.cl'],
    typ: 'savetowallet',
    payload: { loyaltyObjects: [loyaltyObject] },
  };

  const token = jwt.sign(payload, serviceKey.private_key, { algorithm: 'RS256' });
  const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

  return Response.redirect(saveUrl, 302);
};
