import type { APIRoute } from 'astro';
import sql from '../../../../lib/db';
import { createMagicToken } from '../../../../lib/client-auth';
import { Resend } from 'resend';

export const POST: APIRoute = async ({ request }) => {
  const { email } = await request.json() as { email: string };
  if (!email) return Response.json({ error: 'Correo requerido' }, { status: 400 });

  const rows = await sql`SELECT id, clinic_name FROM s90_clients WHERE email = ${email.toLowerCase().trim()} LIMIT 1`;
  // Respond the same way whether client exists or not (security)
  if (!rows[0]) return Response.json({ ok: true });

  const client = rows[0] as any;
  const token = await createMagicToken(client.id);
  const link = `${import.meta.env.SITE_URL ?? 'https://reclubcl.com'}/api/s90/auth/verify?token=${token}`;

  const resend = new Resend(import.meta.env.RESEND_API_KEY as string);
  await resend.emails.send({
    from: 'ReClub <noreply@reclubcl.com>',
    to: email,
    subject: 'Tu acceso al panel Sistema 90',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#020202;color:#F5F5F7;padding:40px 32px;border-radius:16px;">
        <p style="font-size:13px;color:#5C5C6A;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 24px;">Sistema 90 — ReClub</p>
        <h1 style="font-size:28px;font-weight:400;margin:0 0 12px;line-height:1.1;">Hola, ${client.clinic_name} 👋</h1>
        <p style="color:#5C5C6A;font-size:15px;line-height:1.6;margin:0 0 32px;">
          Solicitaste acceso a tu panel. Este enlace es válido por 7 días y solo puede usarse una vez.
        </p>
        <a href="${link}" style="display:inline-block;background:#F5F5F7;color:#020202;font-weight:600;font-size:15px;padding:14px 28px;border-radius:100px;text-decoration:none;">
          Entrar a mi panel →
        </a>
        <p style="margin-top:32px;font-size:12px;color:#5C5C6A;">Si no solicitaste esto, ignora este correo.</p>
      </div>
    `,
  });

  return Response.json({ ok: true });
};
