-- Tabla de fotos para el portafolio de ReClub

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

create policy "Public read photos" on portfolio_photos
  for select using (true);

create policy "Auth manage photos" on portfolio_photos
  for all using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- El bucket 'portfolio' ya existe, solo añadimos políticas si faltan
-- Las fotos se guardan en photos/ dentro del mismo bucket
