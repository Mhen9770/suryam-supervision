create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null default 'employee',
  branch text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  gstin text,
  billing_address text,
  shipping_address text,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  source text not null default 'Website',
  status text not null default 'New',
  requirement text,
  assigned_to uuid references profiles(id),
  customer_id uuid references customers(id),
  next_follow_up_at timestamptz,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  category text not null,
  brand text,
  unit text not null default 'pcs',
  sale_price numeric(12,2) not null default 0,
  low_stock_qty integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists service_tickets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  priority text not null default 'Medium',
  status text not null default 'Open',
  issue text not null,
  assigned_to uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid,
  action text not null,
  actor_id uuid references profiles(id),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_status on leads(status) where deleted_at is null;
create index if not exists idx_customers_phone on customers(phone) where deleted_at is null;
create index if not exists idx_service_status on service_tickets(status) where deleted_at is null;

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_profiles_updated on profiles;
create trigger trg_profiles_updated before update on profiles for each row execute function set_updated_at();
drop trigger if exists trg_customers_updated on customers;
create trigger trg_customers_updated before update on customers for each row execute function set_updated_at();
drop trigger if exists trg_leads_updated on leads;
create trigger trg_leads_updated before update on leads for each row execute function set_updated_at();

alter table profiles enable row level security;
alter table customers enable row level security;
alter table leads enable row level security;
alter table products enable row level security;
alter table service_tickets enable row level security;
alter table audit_logs enable row level security;

create policy "authenticated read profiles" on profiles for select to authenticated using (deleted_at is null);
create policy "authenticated manage customers" on customers for all to authenticated using (deleted_at is null) with check (true);
create policy "authenticated manage leads" on leads for all to authenticated using (deleted_at is null) with check (true);
create policy "authenticated manage products" on products for all to authenticated using (deleted_at is null) with check (true);
create policy "authenticated manage tickets" on service_tickets for all to authenticated using (deleted_at is null) with check (true);
create policy "authenticated read audits" on audit_logs for select to authenticated using (true);

insert into products (sku, name, category, brand, sale_price) values
('CAM-2MP-DOME', '2MP Dome CCTV Camera', 'Camera', 'Hikvision', 2200),
('NVR-8CH', '8 Channel NVR', 'Recorder', 'CP Plus', 6500),
('CAB-CAT6', 'CAT6 CCTV Cable Meter', 'Cable', 'D-Link', 28)
on conflict (sku) do nothing;
