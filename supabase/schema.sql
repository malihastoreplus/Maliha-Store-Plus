-- Maliha Store Plus database schema
-- Run this in Supabase Dashboard > SQL Editor > New query.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','seller','admin')),
  seller_status text not null default 'not_applied' check (seller_status in ('not_applied','pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  category text,
  image_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id),
  customer_name text not null,
  phone text not null,
  delivery_address text not null,
  total_amount numeric(12,2) not null,
  payment_method text not null default 'COD',
  status text not null default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_title text not null,
  unit_price numeric(12,2) not null,
  quantity integer not null default 1 check (quantity > 0)
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Profile: users can view/update their own profile. Admin policies are added below.
create policy "profile read own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profile insert own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profile update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Create a profile automatically for each new signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Products: everyone can view approved products; sellers manage their own; admin manages all.
create policy "public read approved products" on public.products for select to anon, authenticated using (status = 'approved' or seller_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "seller insert own products" on public.products for insert to authenticated with check (seller_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('seller','admin')));
create policy "seller update own products" on public.products for update to authenticated using (seller_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')) with check (seller_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Orders: customer can create/read own; admin can view/update.
create policy "customer create own orders" on public.orders for insert to authenticated with check (customer_id = auth.uid());
create policy "customer or admin read orders" on public.orders for select to authenticated using (customer_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admin update orders" on public.orders for update to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "order items read customer or admin" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))));
create policy "customer add own order items" on public.order_items for insert to authenticated with check (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));

-- IMPORTANT: after your first signup, find your user UUID in Authentication > Users.
-- Then run this once, replacing YOUR-USER-UUID, to grant your own account admin rights:
-- update public.profiles set role='admin', seller_status='approved' where id='YOUR-USER-UUID';
