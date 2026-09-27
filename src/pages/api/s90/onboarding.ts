import type { APIRoute } from 'astro';
import sql from '../../../lib/db';
import { getClientSession } from '../../../lib/client-auth';
import { Resend } from 'resend';
import { put } from '@vercel/blob';

export const POST: APIRoute = async ({ request }) => {
  const session = await getClientSession(request);
  const contentType = request.headers.get('content-type') ?? '';

  let data: Record<string, any> = {};
  let clientId: string | null = session?.client_id ?? null;
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
    clientId = data.client_id ?? clientId;
  }

  await sql`
    INSERT INTO s90_onboarding (client_id, data)
    VALUES (${clientId}, ${JSON.stringify(data)})
  `;

  // Notify admin
  try {
    const adminEmail = import.meta.env.ADMIN_EMAIL as string;
    if (adminEmail) {
      const resend = new Resend(import.meta.env.RESEND_API_KEY as string);
      await resend.emails.send({
        from: 'ReClub <noreply@reclubcl.com>',
        to: adminEmail,
        subject: `Nuevo formulario Sistema 90 — ${data.clinic_name ?? 'Sin nombre'}`,
        html: `<pre style="font-family:monospace;font-size:13px;">${JSON.stringify(data, null, 2)}</pre>`,
      });
    }
  } catch {}

  return Response.json({ ok: true });
};
