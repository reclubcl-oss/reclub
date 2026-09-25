import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import sql from '../../../lib/db';
import { checkAuth } from '../../../lib/auth';

const resend = new Resend(import.meta.env.RESEND_API_KEY as string);

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Datos inválidos' }, { status: 400 });
  }

  const { nombre, negocio, rubro, whatsapp, email, presupuesto, mensaje } = body;
  if (!nombre || !negocio || !rubro || !whatsapp || !email || !presupuesto) {
    return Response.json({ ok: false, error: 'Faltan campos obligatorios' }, { status: 400 });
  }

  // Guardar en DB
  const [lead] = await sql`
    INSERT INTO whatsapp_leads (nombre, negocio, rubro, whatsapp, email, presupuesto, mensaje)
    VALUES (${nombre}, ${negocio}, ${rubro}, ${whatsapp}, ${email}, ${presupuesto}, ${mensaje ?? null})
    RETURNING id, created_at
  `;

  // Enviar emails
  const apiKey = import.meta.env.RESEND_API_KEY as string;
  if (apiKey) {
    const waLink = `https://wa.me/${whatsapp.replace(/\D/g, '')}`;
    const adminLink = 'https://reclubcl.com/admin/whatsapp';

    // Email al lead
    await resend.emails.send({
      from: 'Benjamín de ReClub <notificaciones@reclubcl.com>',
      to: [email],
      subject: `Recibí tu solicitud, ${nombre.split(' ')[0]}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; color: #f8fafc; border-radius: 16px; overflow: hidden;">
          <div style="background: #16a34a; padding: 28px 32px;">
            <p style="margin: 0; font-size: 13px; color: #bbf7d0; font-weight: 600;">ReClub · Sistema de Trabajo Digital</p>
            <h1 style="margin: 10px 0 0; font-size: 26px; font-weight: 800; color: #fff;">Hola, ${nombre.split(' ')[0]}. Recibí tu solicitud.</h1>
          </div>
          <div style="padding: 32px;">
            <p style="margin: 0 0 16px; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
              Gracias por interesarte en el Sistema de Trabajo para <strong style="color: #fff;">${negocio}</strong>.
              Me pongo en contacto contigo por WhatsApp en las próximas <strong style="color: #4ade80;">12 horas</strong> para coordinar una reunión de 30 minutos y ver si es la opción correcta para tu negocio.
            </p>
            <p style="margin: 0 0 28px; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
              Si no puedes esperar, escríbeme directamente:
            </p>
            <a href="https://wa.me/56938897621?text=Hola%20Benjam%C3%ADn%2C%20acabo%20de%20solicitar%20informaci%C3%B3n%20sobre%20el%20Sistema%20de%20Trabajo%20para%20${encodeURIComponent(negocio)}"
              style="display: inline-block; background: #16a34a; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px;">
              Escribirme por WhatsApp
            </a>
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #1e293b;" />
            <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.6;">
              <strong style="color: #94a3b8;">Benjamín Tapia</strong><br/>
              ReClub · Contenido + Meta Ads + WhatsApp<br/>
              <a href="https://reclubcl.com" style="color: #4ade80; text-decoration: none;">reclubcl.com</a>
            </p>
          </div>
        </div>
      `,
    });

    // Email de notificación interna
    await resend.emails.send({
      from: 'ReClub <notificaciones@reclubcl.com>',
      to: ['reclubcl@gmail.com'],
      subject: `Nuevo lead: ${nombre} — ${negocio}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; color: #f8fafc; border-radius: 16px; overflow: hidden;">
          <div style="background: #16a34a; padding: 24px 32px;">
            <p style="margin: 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #bbf7d0;">Nuevo lead · Sistema WhatsApp</p>
            <h1 style="margin: 8px 0 0; font-size: 24px; font-weight: 800; color: #fff;">${nombre}</h1>
            <p style="margin: 4px 0 0; color: #dcfce7; font-size: 14px;">${negocio} · ${rubro}</p>
          </div>
          <div style="padding: 28px 32px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 13px; width: 140px;">WhatsApp</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; font-weight: 600; font-size: 13px;">${whatsapp}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 13px;">Email</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; font-size: 13px;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 13px;">Presupuesto</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; font-size: 13px;">${presupuesto}</td>
              </tr>
              ${mensaje ? `
              <tr>
                <td style="padding: 10px 0; color: #94a3b8; font-size: 13px; vertical-align: top;">Mensaje</td>
                <td style="padding: 10px 0; font-size: 13px; line-height: 1.5;">${mensaje}</td>
              </tr>
              ` : ''}
            </table>

            <div style="margin-top: 28px; display: flex; gap: 12px;">
              <a href="${waLink}" style="display: inline-block; background: #16a34a; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 14px;">
                Abrir WhatsApp
              </a>
              <a href="${adminLink}" style="display: inline-block; background: #1e293b; color: #f8fafc; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px;">
                Ver en Admin
              </a>
            </div>
          </div>
          <div style="padding: 16px 32px; background: #111; border-top: 1px solid #1e293b;">
            <p style="margin: 0; font-size: 11px; color: #475569;">Lead #${(lead as any).id} · ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}</p>
          </div>
        </div>
      `,
    });
  }

  return Response.json({ ok: true, id: (lead as any).id });
};

export const GET: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) return new Response('Unauthorized', { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const page = parseInt(url.searchParams.get('page') ?? '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  const leads = status
    ? await sql`SELECT * FROM whatsapp_leads WHERE status = ${status} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
    : await sql`SELECT * FROM whatsapp_leads ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

  const [{ count }] = await (status
    ? sql`SELECT COUNT(*) FROM whatsapp_leads WHERE status = ${status}`
    : sql`SELECT COUNT(*) FROM whatsapp_leads`);

  return Response.json({ leads, total: Number(count), page, limit });
};

export const PATCH: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) return new Response('Unauthorized', { status: 401 });

  const { id, status, notas } = await request.json() as { id: number; status?: string; notas?: string };
  await sql`
    UPDATE whatsapp_leads
    SET
      status = COALESCE(${status ?? null}, status),
      notas  = COALESCE(${notas ?? null}, notas),
      updated_at = NOW()
    WHERE id = ${id}
  `;
  return Response.json({ ok: true });
};
