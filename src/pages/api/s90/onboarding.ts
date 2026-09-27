import type { APIRoute } from 'astro';
import sql from '../../../lib/db';
import { Resend } from 'resend';
import { put } from '@vercel/blob';

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get('content-type') ?? '';

  let data: Record<string, any> = {};
  let clientId: string | null = null;
  let logoUrl: string | null = null;

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    for (const [key, value] of form.entries()) {
      if (key === 'logo' && value instanceof File && value.size > 0) {
        const blob = await put(`onboarding/logo-${Date.now()}-${value.name}`, value, { access: 'public' });
        logoUrl = blob.url;
      } else if (key === 'treatments') {
        try { data[key] = JSON.parse(value as string); } catch { data[key] = value; }
      } else {
        data[key] = value;
      }
    }
    if (logoUrl) data.logo_url = logoUrl;
  } else {
    data = await request.json();
  }

  clientId = data.client_id ?? null;

  // Si no hay cliente previo, crear uno automáticamente
  let clientToken: string | null = null;
  if (!clientId) {
    const today = new Date().toISOString().split('T')[0];
    const newClient = await sql`
      INSERT INTO s90_clients (clinic_name, contact_name, email, start_date, plan)
      VALUES (
        ${data.clinic_name ?? 'Sin nombre'},
        ${data.contact_name ?? ''},
        ${data.email ?? ''},
        ${today},
        'cuotas'
      )
      RETURNING id, client_token
    `;
    clientId = (newClient[0] as any).id;
    clientToken = (newClient[0] as any).client_token;

    // Crear entregables por defecto
    const deliverables = [
      'Estrategia de contenido',
      'Configuración de campañas Meta Ads',
      'Pack de 4 reels — Mes 1',
      'Pack de 4 reels — Mes 2',
      'Pack de 4 reels — Mes 3',
      'Informe de resultados mensual',
      'Reunión Día 30',
      'Reunión Día 60',
      'Cierre y entrega final Día 90',
    ];
    for (let i = 0; i < deliverables.length; i++) {
      await sql`INSERT INTO s90_deliverables (client_id, name, sort_order) VALUES (${clientId}, ${deliverables[i]}, ${i + 1})`;
    }
  } else {
    const rows = await sql`SELECT client_token FROM s90_clients WHERE id = ${clientId} LIMIT 1`;
    clientToken = (rows[0] as any)?.client_token ?? null;
  }

  await sql`
    INSERT INTO s90_onboarding (client_id, data)
    VALUES (${clientId}, ${JSON.stringify(data)})
  `;

  // Notificar admin
  try {
    const adminEmail = import.meta.env.ADMIN_EMAIL as string;
    if (adminEmail) {
      const resend = new Resend(import.meta.env.RESEND_API_KEY as string);
      await resend.emails.send({
        from: 'ReClub <noreply@reclubcl.com>',
        to: adminEmail,
        subject: `Nuevo formulario Sistema 90 — ${data.clinic_name ?? 'Sin nombre'}`,
        html: `<p><strong>Cliente:</strong> ${data.clinic_name}<br><strong>Correo:</strong> ${data.email}<br><strong>Panel:</strong> <a href="https://reclubcl.com/panel/${clientToken}">reclubcl.com/panel/${clientToken}</a></p><pre style="font-family:monospace;font-size:13px;">${JSON.stringify(data, null, 2)}</pre>`,
      });
    }
  } catch {}

  return Response.json({ ok: true, client_token: clientToken });
};
