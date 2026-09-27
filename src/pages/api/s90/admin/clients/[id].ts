import type { APIRoute } from 'astro';
import sql from '../../../../../lib/db';
import { checkAuth } from '../../../../../lib/auth';
import { createMagicToken } from '../../../../../lib/client-auth';
import { Resend } from 'resend';

export const GET: APIRoute = async ({ request, params }) => {
  if (!checkAuth(request)) return new Response('Unauthorized', { status: 401 });
  const { id } = params;
  const [client, deliverables, metrics, payments, documents, onboarding] = await Promise.all([
    sql`SELECT * FROM s90_clients WHERE id = ${id!} LIMIT 1`,
    sql`SELECT * FROM s90_deliverables WHERE client_id = ${id!} ORDER BY sort_order`,
    sql`SELECT * FROM s90_metrics WHERE client_id = ${id!} ORDER BY month`,
    sql`SELECT * FROM s90_payments WHERE client_id = ${id!} ORDER BY installment`,
    sql`SELECT * FROM s90_documents WHERE client_id = ${id!} ORDER BY uploaded_at DESC`,
    sql`SELECT * FROM s90_onboarding WHERE client_id = ${id!} ORDER BY submitted_at DESC LIMIT 1`,
  ]);
  if (!client[0]) return new Response('Not found', { status: 404 });
  return Response.json({ client: client[0], deliverables, metrics, payments, documents, onboarding: onboarding[0] ?? null });
};

export const PUT: APIRoute = async ({ request, params }) => {
  if (!checkAuth(request)) return new Response('Unauthorized', { status: 401 });
  const { id } = params;
  const body = await request.json() as any;

  if (body.action === 'send_link') {
    const token = await createMagicToken(id!);
    const link = `${import.meta.env.SITE_URL ?? 'https://reclubcl.com'}/api/s90/auth/verify?token=${token}`;
    const rows = await sql`SELECT email, clinic_name FROM s90_clients WHERE id = ${id!} LIMIT 1`;
    const client = rows[0] as any;
    const resend = new Resend(import.meta.env.RESEND_API_KEY as string);
    await resend.emails.send({
      from: 'ReClub <noreply@reclubcl.com>',
      to: client.email,
      subject: 'Tu acceso al panel Sistema 90',
      html: `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#020202;color:#F5F5F7;padding:40px 32px;border-radius:16px;">
        <h1 style="font-size:24px;font-weight:400;margin:0 0 16px;">Acceso a tu panel, ${client.clinic_name}</h1>
        <a href="${link}" style="display:inline-block;background:#F5F5F7;color:#020202;font-weight:600;font-size:15px;padding:14px 28px;border-radius:100px;text-decoration:none;">Entrar →</a>
        <p style="margin-top:16px;color:#5C5C6A;font-size:13px;">Válido por 7 días.</p>
      </div>`,
    });
    return Response.json({ ok: true, link });
  }

  if (body.action === 'update_deliverable') {
    await sql`UPDATE s90_deliverables SET status = ${body.status}, link = ${body.link ?? null}, updated_at = NOW() WHERE id = ${body.deliverable_id}`;
    return Response.json({ ok: true });
  }

  if (body.action === 'upsert_metric') {
    await sql`
      INSERT INTO s90_metrics (client_id, month, ad_spend, conversations, cost_per_conv, patients_booked, reels_published)
      VALUES (${id!}, ${body.month}, ${body.ad_spend}, ${body.conversations}, ${body.cost_per_conv}, ${body.patients_booked}, ${body.reels_published})
      ON CONFLICT (client_id, month) DO UPDATE SET
        ad_spend = EXCLUDED.ad_spend, conversations = EXCLUDED.conversations,
        cost_per_conv = EXCLUDED.cost_per_conv, patients_booked = EXCLUDED.patients_booked,
        reels_published = EXCLUDED.reels_published
    `;
    return Response.json({ ok: true });
  }

  if (body.action === 'update_payment') {
    await sql`UPDATE s90_payments SET status = ${body.status}, paid_at = ${body.paid_at ?? null} WHERE id = ${body.payment_id}`;
    return Response.json({ ok: true });
  }

  if (body.action === 'add_document') {
    await sql`INSERT INTO s90_documents (client_id, name, url) VALUES (${id!}, ${body.name}, ${body.url})`;
    return Response.json({ ok: true });
  }

  // Update client fields
  const { clinic_name, contact_name, start_date, plan, payment_link, calendar_link, drive_link } = body;
  await sql`
    UPDATE s90_clients SET
      clinic_name = COALESCE(${clinic_name ?? null}, clinic_name),
      contact_name = COALESCE(${contact_name ?? null}, contact_name),
      start_date = COALESCE(${start_date ?? null}, start_date),
      plan = COALESCE(${plan ?? null}, plan),
      payment_link = COALESCE(${payment_link ?? null}, payment_link),
      calendar_link = COALESCE(${calendar_link ?? null}, calendar_link),
      drive_link = COALESCE(${drive_link ?? null}, drive_link)
    WHERE id = ${id!}
  `;
  return Response.json({ ok: true });
};
