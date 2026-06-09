import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const key = (import.meta.env.SUPABASE_SERVICE_KEY || '').trim();
  const projectRef = 'thafylagblxtfwivkbwb';

  const sql = `
    create table if not exists portfolio_videos (
      id uuid primary key default gen_random_uuid(),
      title text not null,
      description text default '',
      video_path text not null,
      thumbnail_path text,
      category text default 'general',
      sort_order int default 0,
      created_at timestamptz default now()
    );
    alter table portfolio_videos enable row level security;
    do $$ begin
      if not exists (select 1 from pg_policies where tablename='portfolio_videos' and policyname='Public read videos') then
        create policy "Public read videos" on portfolio_videos for select using (true);
      end if;
      if not exists (select 1 from pg_policies where tablename='portfolio_videos' and policyname='Auth manage videos') then
        create policy "Auth manage videos" on portfolio_videos for all using (auth.uid() is not null) with check (auth.uid() is not null);
      end if;
    end $$;

    create table if not exists portfolio_brands (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      logo_path text,
      website_url text default '',
      sort_order int default 0,
      created_at timestamptz default now()
    );
    alter table portfolio_brands enable row level security;
    do $$ begin
      if not exists (select 1 from pg_policies where tablename='portfolio_brands' and policyname='Public read brands') then
        create policy "Public read brands" on portfolio_brands for select using (true);
      end if;
      if not exists (select 1 from pg_policies where tablename='portfolio_brands' and policyname='Auth manage brands') then
        create policy "Auth manage brands" on portfolio_brands for all using (auth.uid() is not null) with check (auth.uid() is not null);
      end if;
    end $$;

    create table if not exists portfolio_photos (
      id uuid primary key default gen_random_uuid(),
      title text not null,
      description text default '',
      image_path text not null,
      category text default 'general',
      sort_order int default 0,
      created_at timestamptz default now()
    );
    alter table portfolio_photos enable row level security;
    do $$ begin
      if not exists (select 1 from pg_policies where tablename='portfolio_photos' and policyname='Public read photos') then
        create policy "Public read photos" on portfolio_photos for select using (true);
      end if;
      if not exists (select 1 from pg_policies where tablename='portfolio_photos' and policyname='Auth manage photos') then
        create policy "Auth manage photos" on portfolio_photos for all using (auth.uid() is not null) with check (auth.uid() is not null);
      end if;
    end $$;
  `;

  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });

    const text = await res.text();
    return new Response(JSON.stringify({ status: res.status, ok: res.ok, body: text.slice(0, 500) }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ caught: String(e) }), { status: 200 });
  }
};
