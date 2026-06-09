import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';

// Endpoint temporal — se elimina después del primer uso
export const GET: APIRoute = async () => {
  const results: any = {};

  // 1. Correr migraciones
  const migrations = [
    // portfolio_videos
    `create table if not exists portfolio_videos (
      id uuid primary key default gen_random_uuid(),
      title text not null,
      description text default '',
      video_path text not null,
      thumbnail_path text,
      category text default 'general',
      sort_order int default 0,
      created_at timestamptz default now()
    )`,
    `alter table portfolio_videos enable row level security`,
    `do $$ begin
      if not exists (select 1 from pg_policies where tablename='portfolio_videos' and policyname='Public read videos') then
        create policy "Public read videos" on portfolio_videos for select using (true);
      end if;
    end $$`,
    `do $$ begin
      if not exists (select 1 from pg_policies where tablename='portfolio_videos' and policyname='Auth manage videos') then
        create policy "Auth manage videos" on portfolio_videos for all using (auth.uid() is not null) with check (auth.uid() is not null);
      end if;
    end $$`,
    // portfolio_brands
    `create table if not exists portfolio_brands (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      logo_path text,
      website_url text default '',
      sort_order int default 0,
      created_at timestamptz default now()
    )`,
    `alter table portfolio_brands enable row level security`,
    `do $$ begin
      if not exists (select 1 from pg_policies where tablename='portfolio_brands' and policyname='Public read brands') then
        create policy "Public read brands" on portfolio_brands for select using (true);
      end if;
    end $$`,
    `do $$ begin
      if not exists (select 1 from pg_policies where tablename='portfolio_brands' and policyname='Auth manage brands') then
        create policy "Auth manage brands" on portfolio_brands for all using (auth.uid() is not null) with check (auth.uid() is not null);
      end if;
    end $$`,
    // portfolio_photos
    `create table if not exists portfolio_photos (
      id uuid primary key default gen_random_uuid(),
      title text not null,
      description text default '',
      image_path text not null,
      category text default 'general',
      sort_order int default 0,
      created_at timestamptz default now()
    )`,
    `alter table portfolio_photos enable row level security`,
    `do $$ begin
      if not exists (select 1 from pg_policies where tablename='portfolio_photos' and policyname='Public read photos') then
        create policy "Public read photos" on portfolio_photos for select using (true);
      end if;
    end $$`,
    `do $$ begin
      if not exists (select 1 from pg_policies where tablename='portfolio_photos' and policyname='Auth manage photos') then
        create policy "Auth manage photos" on portfolio_photos for all using (auth.uid() is not null) with check (auth.uid() is not null);
      end if;
    end $$`,
    // Storage bucket
    `insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', true) on conflict (id) do nothing`,
    `do $$ begin
      if not exists (select 1 from pg_policies where tablename='objects' and policyname='Public read portfolio storage') then
        create policy "Public read portfolio storage" on storage.objects for select using (bucket_id = 'portfolio');
      end if;
    end $$`,
    `do $$ begin
      if not exists (select 1 from pg_policies where tablename='objects' and policyname='Auth upload portfolio storage') then
        create policy "Auth upload portfolio storage" on storage.objects for insert with check (bucket_id = 'portfolio' and auth.uid() is not null);
      end if;
    end $$`,
    `do $$ begin
      if not exists (select 1 from pg_policies where tablename='objects' and policyname='Auth delete portfolio storage') then
        create policy "Auth delete portfolio storage" on storage.objects for delete using (bucket_id = 'portfolio' and auth.uid() is not null);
      end if;
    end $$`,
  ];

  const migrationErrors: string[] = [];
  for (const sql of migrations) {
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql }).catch(() => ({ error: null }));
    // rpc might not exist, use raw query via postgrest
    if (error) migrationErrors.push(error.message);
  }
  results.migrations = migrationErrors.length === 0 ? 'ok' : migrationErrors;

  // 2. Crear usuario admin
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'benjamin.tapia.r1@gmail.com',
      password: 'Rapido12',
      email_confirm: true,
    });
    if (error) {
      if (error.message?.includes('already') || error.code === 'email_exists') {
        results.user = 'already_exists';
      } else {
        results.user = { error: error.message, code: error.code };
      }
    } else {
      results.user = { created: true, id: data.user?.id };
    }
  } catch (e: any) {
    results.user = { caught: e?.message };
  }

  return new Response(JSON.stringify(results, null, 2), { status: 200 });
};
