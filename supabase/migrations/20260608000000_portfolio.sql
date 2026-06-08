-- Portfolio: videos y marcas para la página personal de Benjamín

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

create table if not exists portfolio_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_path text,
  website_url text default '',
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table portfolio_videos enable row level security;
alter table portfolio_brands enable row level security;

create policy "Public read videos" on portfolio_videos
  for select using (true);

create policy "Auth manage videos" on portfolio_videos
  for all using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "Public read brands" on portfolio_brands
  for select using (true);

create policy "Auth manage brands" on portfolio_brands
  for all using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Bucket público para videos, thumbnails y logos
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

create policy "Public read portfolio storage" on storage.objects
  for select using (bucket_id = 'portfolio');

create policy "Auth upload portfolio storage" on storage.objects
  for insert with check (bucket_id = 'portfolio' and auth.uid() is not null);

create policy "Auth update portfolio storage" on storage.objects
  for update using (bucket_id = 'portfolio' and auth.uid() is not null);

create policy "Auth delete portfolio storage" on storage.objects
  for delete using (bucket_id = 'portfolio' and auth.uid() is not null);
