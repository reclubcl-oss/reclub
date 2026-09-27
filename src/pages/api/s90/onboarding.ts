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
      const treatments = Array.isArray(data.treatments)
        ? data.treatments.filter((t: any) => t.name).map((t: any) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #1C1C24;color:#F5F5F7;">${t.name}</td><td style="padding:6px 12px;border-bottom:1px solid #1C1C24;color:#A0A0B0;text-align:right;">${t.price}</td></tr>`).join('')
        : '';
      const accesos = ['meta','ig','wa'].filter(k => data[`access_${k}`] === 'si').map(k => ({meta:'Meta Ads',ig:'Instagram Business',wa:'WhatsApp Business'}[k]));
      const panelUrl = `https://reclubcl.com/panel/${clientToken}`;

      const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0A0A0F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0F;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header -->
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:13px;font-weight:600;color:#F5F5F7;letter-spacing:0.05em;">ReClub</p>
          <p style="margin:4px 0 0;font-size:11px;color:#5C5C6A;letter-spacing:0.15em;text-transform:uppercase;">Sistema 90 — Nuevo cliente</p>
        </td></tr>

        <!-- Nombre clínica -->
        <tr><td style="padding-bottom:24px;">
          <h1 style="margin:0;font-size:28px;font-weight:400;color:#F5F5F7;letter-spacing:-0.02em;line-height:1.2;">${data.clinic_name ?? 'Sin nombre'}</h1>
          <p style="margin:8px 0 0;font-size:14px;color:#5C5C6A;">Formulario de bienvenida recibido</p>
        </td></tr>

        <!-- Acceso al panel -->
        <tr><td style="padding-bottom:24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111116;border:1px solid #1C1C24;border-radius:16px;overflow:hidden;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0 0 8px;font-size:10px;color:#5C5C6A;text-transform:uppercase;letter-spacing:0.15em;">Panel del cliente</p>
              <a href="${panelUrl}" style="color:#F5F5F7;font-size:13px;word-break:break-all;">${panelUrl}</a>
            </td></tr>
            <tr><td style="padding:0 20px 16px;">
              <a href="${panelUrl}" style="display:inline-block;background:#F5F5F7;color:#0A0A0F;font-size:13px;font-weight:600;padding:10px 20px;border-radius:100px;text-decoration:none;">Ver panel →</a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Datos de contacto -->
        <tr><td style="padding-bottom:16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111116;border:1px solid #1C1C24;border-radius:16px;overflow:hidden;">
            <tr><td colspan="2" style="padding:14px 20px 10px;border-bottom:1px solid #1C1C24;">
              <p style="margin:0;font-size:10px;color:#5C5C6A;text-transform:uppercase;letter-spacing:0.15em;">Contacto</p>
            </td></tr>
            ${[
              ['Nombre', `${data.contact_name ?? '—'}${data.contact_role ? `, ${data.contact_role}` : ''}`],
              ['Teléfono', data.phone ?? '—'],
              ['Correo', data.email ?? '—'],
              ['Instagram', data.instagram ?? '—'],
            ].map(([label, value]) => `
            <tr>
              <td style="padding:8px 20px;color:#5C5C6A;font-size:13px;width:40%;border-bottom:1px solid #1C1C24;">${label}</td>
              <td style="padding:8px 20px;color:#F5F5F7;font-size:13px;border-bottom:1px solid #1C1C24;">${value}</td>
            </tr>`).join('')}
          </table>
        </td></tr>

        <!-- Tratamientos -->
        ${treatments ? `<tr><td style="padding-bottom:16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111116;border:1px solid #1C1C24;border-radius:16px;overflow:hidden;">
            <tr><td colspan="2" style="padding:14px 20px 10px;border-bottom:1px solid #1C1C24;">
              <p style="margin:0;font-size:10px;color:#5C5C6A;text-transform:uppercase;letter-spacing:0.15em;">Tratamientos foco</p>
            </td></tr>
            ${treatments}
          </table>
        </td></tr>` : ''}

        <!-- Grabaciones y accesos -->
        <tr><td style="padding-bottom:16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111116;border:1px solid #1C1C24;border-radius:16px;overflow:hidden;">
            <tr><td colspan="2" style="padding:14px 20px 10px;border-bottom:1px solid #1C1C24;">
              <p style="margin:0;font-size:10px;color:#5C5C6A;text-transform:uppercase;letter-spacing:0.15em;">Grabaciones</p>
            </td></tr>
            ${[
              ['Días disponibles', data.recording_days ?? '—'],
              ['En cámara', data.on_camera ?? '—'],
            ].map(([label, value]) => `
            <tr>
              <td style="padding:8px 20px;color:#5C5C6A;font-size:13px;width:40%;border-bottom:1px solid #1C1C24;">${label}</td>
              <td style="padding:8px 20px;color:#F5F5F7;font-size:13px;border-bottom:1px solid #1C1C24;">${value}</td>
            </tr>`).join('')}
            <tr>
              <td style="padding:8px 20px;color:#5C5C6A;font-size:13px;width:40%;">Accesos listos</td>
              <td style="padding:8px 20px;color:#F5F5F7;font-size:13px;">${accesos.length ? accesos.join(', ') : 'Ninguno marcado'}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#3C3C4A;">ReClub · Sistema 90</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await resend.emails.send({
        from: 'ReClub <noreply@reclubcl.com>',
        to: adminEmail,
        subject: `🆕 Sistema 90 — ${data.clinic_name ?? 'Nuevo cliente'}`,
        html,
      });
    }
  } catch {}

  return Response.json({ ok: true, client_token: clientToken });
};
