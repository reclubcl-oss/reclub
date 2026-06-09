import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
  try {
    const url = (import.meta.env.PUBLIC_SUPABASE_URL || '').trim();
    const key = (import.meta.env.SUPABASE_SERVICE_KEY || '').trim();
    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

    const results: Record<string, string> = {};

    // Helper: run raw SQL via pg REST
    async function sql(name: string, query: string) {
      const res = await fetch(`${url}/rest/v1/rpc/run_sql`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'apikey': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      // if rpc doesn't exist, use supabase directly
      results[name] = res.ok ? 'ok' : `http_${res.status}`;
    }

    // Create tables via supabase-js insert trick not applicable for DDL
    // Use fetch to PostgREST SQL endpoint
    const ddlStatements = [
      ['videos_table', `create table if not exists portfolio_videos (id uuid primary key default gen_random_uuid(), title text not null, description text default '', video_path text not null, thumbnail_path text, category text default 'general', sort_order int default 0, created_at timestamptz default now())`],
      ['brands_table', `create table if not exists portfolio_brands (id uuid primary key default gen_random_uuid(), name text not null, logo_path text, website_url text default '', sort_order int default 0, created_at timestamptz default now())`],
      ['photos_table', `create table if not exists portfolio_photos (id uuid primary key default gen_random_uuid(), title text not null, description text default '', image_path text not null, category text default 'general', sort_order int default 0, created_at timestamptz default now())`],
    ];

    for (const [name, query] of ddlStatements) {
      await sql(name, query);
    }

    // Try storage bucket via admin
    const bucketRes = await fetch(`${url}/storage/v1/bucket`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'apikey': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'portfolio', name: 'portfolio', public: true }),
    });
    results['storage_bucket'] = bucketRes.ok ? 'created' : `${bucketRes.status} (may already exist)`;

    // Verify tables exist by querying them
    const checks = ['portfolio_videos', 'portfolio_brands', 'portfolio_photos'];
    for (const table of checks) {
      const { error } = await admin.from(table).select('id').limit(1);
      results[`check_${table}`] = error ? `ERROR: ${error.message}` : 'EXISTS ✓';
    }

    return new Response(JSON.stringify(results, null, 2), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ caught: String(e) }), { status: 200 });
  }
};
