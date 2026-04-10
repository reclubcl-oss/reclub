export const prerender = false;

import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase';

export const GET: APIRoute = async ({ params }) => {
  const { cardId } = params;

  if (!import.meta.env.APPLE_CERT_PEM) {
    return new Response(
      JSON.stringify({
        error: 'Apple Wallet aún no está configurado. Contacta a ReClub para activarlo.',
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

  // Dynamically import to avoid build errors when passkit-generator is absent
  const { PKPass } = await import('passkit-generator');

  const business = card.business;
  const isStamps = business.loyalty_type === 'stamps';

  const pass = await PKPass.from(
    {
      model: {
        passTypeIdentifier: import.meta.env.APPLE_PASS_TYPE_ID,
        teamIdentifier: import.meta.env.APPLE_TEAM_ID,
        organizationName: business.name,
        description: `${business.name} — Fidelización ReClub`,
        foregroundColor: 'rgb(248, 250, 252)',
        backgroundColor: 'rgb(10, 10, 10)',
        labelColor: 'rgb(148, 163, 184)',
        serialNumber: card.id,
        storeCard: {
          primaryFields: [
            {
              key: 'loyalty',
              label: isStamps ? 'Sellos' : 'Puntos',
              value: isStamps
                ? `${card.stamps} / ${business.stamps_total}`
                : String(card.points),
            },
          ],
          secondaryFields: [
            {
              key: 'reward',
              label: 'Premio',
              value: business.reward_description || 'Consulta en tienda',
            },
          ],
          backFields: [
            { key: 'client_phone', label: 'Teléfono', value: card.client.phone },
            { key: 'client_email', label: 'Email', value: card.client.email },
            { key: 'powered_by', label: 'Powered by', value: 'ReClub — reclub.cl' },
          ],
        },
        barcodes: [
          {
            message: card.qr_token,
            format: 'PKBarcodeFormatQR',
            messageEncoding: 'iso-8859-1',
          },
        ],
      },
      certificates: {
        wwdr: Buffer.from(import.meta.env.APPLE_WWDR_CERT, 'base64'),
        signerCert: Buffer.from(import.meta.env.APPLE_CERT_PEM, 'base64'),
        signerKey: Buffer.from(import.meta.env.APPLE_KEY_PEM, 'base64'),
        signerKeyPassphrase: import.meta.env.APPLE_CERT_PASSWORD || '',
      },
    },
    {},
  );

  const buffer = pass.getAsBuffer();

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': `attachment; filename="reclub-${cardId}.pkpass"`,
      'Cache-Control': 'no-store',
    },
  });
};
