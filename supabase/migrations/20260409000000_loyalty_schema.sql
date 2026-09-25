-- ReClub Loyalty App — Schema completo
-- Ejecutar en Supabase SQL Editor

-- =============================================
-- TABLES
-- =============================================

-- Negocios que usan ReClub
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  color text default '#3B82F6',
  loyalty_type text check (loyalty_type in ('stamps', 'points')) default 'stamps',
  stamps_total int default 10,
  points_per_thousand int default 10,
  reward_description text,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Clientes finales (se identifican con teléfono + email, sin contraseña)
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  email text unique not null,
  name text,
  created_at timestamptz default now()
);

-- Tarjetas de fidelización (1 por cliente por negocio)
create table if not exists public.loyalty_cards (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  stamps int default 0,
  points int default 0,
  qr_token text unique default gen_random_uuid()::text,
  created_at timestamptz default now(),
  unique(client_id, business_id)
);

-- Historial de transacciones
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references public.loyalty_cards(id) on delete cascade,
  type text check (type in ('stamp', 'points', 'redeem')) not null,
  amount int not null,
  note text,
  scanned_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table public.businesses enable row level security;
alter table public.clients enable row level security;
alter table public.loyalty_cards enable row level security;
alter table public.transactions enable row level security;

-- Negocios: el dueño puede ver y editar los suyos
create policy "businesses_owner_all" on public.businesses
  for all using (owner_id = auth.uid());

-- Clientes, tarjetas, transacciones: solo service_role (las API routes usan service key)
-- Bloqueado para usuarios normales; las API routes hacen bypass con service key.
create policy "clients_service_only" on public.clients
  for all using (false);

create policy "loyalty_cards_service_only" on public.loyalty_cards
  for all using (false);

create policy "transactions_service_only" on public.transactions
  for all using (false);

-- =============================================
-- INDEXES
-- =============================================

create index if not exists idx_loyalty_cards_client on public.loyalty_cards(client_id);
create index if not exists idx_loyalty_cards_business on public.loyalty_cards(business_id);
create index if not exists idx_loyalty_cards_qr on public.loyalty_cards(qr_token);
create index if not exists idx_transactions_card on public.transactions(card_id);
create index if not exists idx_transactions_created on public.transactions(created_at desc);
create index if not exists idx_businesses_owner on public.businesses(owner_id);
create index if not exists idx_businesses_slug on public.businesses(slug);
