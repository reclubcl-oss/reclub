import type { APIRoute } from 'astro';
import sql from '../../../../lib/db';
import { checkAuth } from '../../../../lib/auth';
import { createMagicToken } from '../../../../lib/client-auth';
import { Resend } from 'resend';

export const GET: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) return new Response('Unauthorized', { status: 401 });
  const clients = await sql`
    SELECT c.*,
      (SELECT submitted_at FROM s90_onboarding WHERE client_id = c.id ORDER BY submitted_at DESC LIMIT 1) as onboarding_at
    FROM s90_clients c ORDER BY c.created_at DESC
  `;
  return Response.json(clients);
};

export const POST: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) return new Response('Unauthorized', { status: 401 });
  const body = await request.json() as {
    clinic_name: string; contact_name?: string; email: string;
    start_date: string; plan: 'unico' | 'cuotas';
    payment_link?: string; calendar_link?: string; drive_link?: string;
    send_welcome?: boolean;
  };

  const [client] = await sql`
    INSERT INTO s90_clients (clinic_name, contact_name, email, start_date, plan, payment_link, calendar_link, drive_link)
    VALUES (${body.clinic_name}, ${body.contact_name ?? null}, ${body.email.toLowerCase()},
            ${body.start_date}, ${body.plan}, ${body.payment_link ?? null},
            ${body.calendar_link ?? null}, ${body.drive_link ?? null})
    RETURNING *
  ` as any[];

  // Create default deliverables
  await sql`
    INSERT INTO s90_deliverables (client_id, name, sort_order) VALUES
    (${client.id}, 'WhatsApp configurado', 1),
    (${client.id}, 'Guión de ventas', 2),
    (${client.id}, 'Grabación Mes 1', 3),
    (${client.id}, 'Reels Mes 1 — carpeta de entrega', 4),
    (${client.id}, 'Grabación Mes 2', 5),
    (${client.id}, 'Reels Mes 2 — carpeta de entrega', 6),
    (${client.id}, 'Grabación Mes 3', 7),
    (${client.id}, 'Reels Mes 3 — carpeta de entrega', 8)
  `;

  // Create payments
  if (body.plan === 'unico') {
    await sql`INSERT INTO s90_payments (client_id, installment, amount, due_date) VALUES (${client.id}, 1, 990000, ${body.start_date})`;
  } else {
    const start = new Date(body.start_date);
    for (let i = 0; i < 3; i++) {
      const due = new Date(start);
      due.setMonth(due.getMonth() + i);
      await sql`INSERT INTO s90_payments (client_id, installment, amount, due_date) VALUES (${client.id}, ${i + 1}, 400000, ${due.toISOString().slice(0, 10)})`;
    }
  }

  // Send magic link if requested
  if (body.send_welcome) {
    const token = await createMagicToken(client.id);
    const link = `${import.meta.env.SITE_URL ?? 'https://reclubcl.com'}/api/s90/auth/verify?token=${token}`;
    const resend = new Resend(import.meta.env.RESEND_API_KEY as string);
    await resend.emails.send({
      from: 'ReClub <noreply@reclubcl.com>',
      to: body.email,
      subject: `¡Bienvenida a Sistema 90, ${body.clinic_name}!`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#020202;color:#F5F5F7;padding:40px 32px;border-radius:16px;">
          <p style="font-size:13px;color:#5C5C6A;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 24px;">Sistema 90 — ReClub</p>
          <h1 style="font-size:28px;font-weight:400;margin:0 0 12px;">¡Bienvenida, ${body.clinic_name}! 🎉</h1>
          <p style="color:#5C5C6A;font-size:15px;line-height:1.6;margin:0 0 32px;">
            Tu acceso al portal de clientes ya está listo. Haz clic para entrar:
          </p>
          <a href="${link}" style="display:inline-block;background:#F5F5F7;color:#020202;font-weight:600;font-size:15px;padding:14px 28px;border-radius:100px;text-decoration:none;">
            Entrar a mi panel →
          </a>
          <p style="margin-top:16px;color:#5C5C6A;font-size:13px;">Este enlace es válido por 7 días.</p>
        </div>
      `,
    });
  }

  return Response.json(client, { status: 201 });
};
