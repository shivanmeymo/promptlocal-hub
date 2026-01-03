-- Runnable schema adapted from provided context-only SQL
-- Targets Supabase Postgres. Safe to run multiple times.

-- Extensions
create extension if not exists pgcrypto;

-- ========== Types ==========
-- Event status enum
do $$ begin
  create type public.event_status as enum ('pending','approved','rejected','cancelled');
exception when duplicate_object then null; end $$;

-- App role enum
do $$ begin
  create type public.app_role as enum ('user','moderator','admin');
exception when duplicate_object then null; end $$;

-- Event category enum (adjust as needed)
do $$ begin
  create type public.event_category as enum ('music','sports','tech','art','community','education','business','health','other');
exception when duplicate_object then null; end $$;

-- ========== Tables ==========
-- contact_messages
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  category text,
  message text not null,
  created_at timestamptz not null default now()
);

-- event_notifications
create table if not exists public.event_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  filters jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  is_active boolean default true
);
create index if not exists event_notifications_user_idx on public.event_notifications(user_id);
create index if not exists event_notifications_active_idx on public.event_notifications(is_active);

-- events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organizer_name text not null,
  organizer_email text not null,
  organizer_description text,
  title text not null,
  description text not null,
  start_date date not null,
  start_time time without time zone not null,
  end_date date not null,
  end_time time without time zone not null,
  location text not null,
  category public.event_category not null default 'other',
  is_free boolean not null default true,
  price numeric,
  image_url text,
  status public.event_status not null default 'pending',
  admin_notes text,
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_online boolean default false,
  organizer_website text,
  is_recurring boolean default false,
  recurring_pattern text,
  other_category text
);
create index if not exists events_user_idx on public.events(user_id);
create index if not exists events_status_idx on public.events(status);
create index if not exists events_date_idx on public.events(start_date, start_time);

-- profiles
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_user_idx on public.profiles(user_id);

-- user_roles
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now()
);
create index if not exists user_roles_user_idx on public.user_roles(user_id);
create index if not exists user_roles_role_idx on public.user_roles(role);

-- ========== Triggers ==========
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists events_touch on public.events;
create trigger events_touch before update on public.events
for each row execute procedure public.touch_updated_at();

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
for each row execute procedure public.touch_updated_at();

-- ========== Helper functions ==========
-- Check if current user is admin
create or replace function public.is_admin(uid uuid default auth.uid()) returns boolean language sql stable as $$
  select exists (
    select 1 from public.user_roles r
    where r.user_id = uid and r.role = 'admin'
  );
$$;

-- ========== RLS enable ==========
alter table public.contact_messages enable row level security;
alter table public.event_notifications enable row level security;
alter table public.events enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- ========== Policies ==========
-- contact_messages
-- Insert: anyone (even anon) can submit
drop policy if exists contact_messages_insert_all on public.contact_messages;
create policy contact_messages_insert_all on public.contact_messages for insert with check (true);
-- Select: admins only
drop policy if exists contact_messages_select_admin on public.contact_messages;
create policy contact_messages_select_admin on public.contact_messages for select using (public.is_admin(auth.uid()));

-- event_notifications
-- Owners (by user_id) can read their notifications; admins can read all
drop policy if exists event_notifications_select_own_or_admin on public.event_notifications;
create policy event_notifications_select_own_or_admin on public.event_notifications for select using (
  user_id = auth.uid() or public.is_admin(auth.uid())
);
-- Insert: authenticated users can create their own
drop policy if exists event_notifications_insert_self on public.event_notifications;
create policy event_notifications_insert_self on public.event_notifications for insert with check (
  auth.uid() is not null and (user_id is null or user_id = auth.uid())
);
-- Update/Delete: owners or admins
drop policy if exists event_notifications_update_own_or_admin on public.event_notifications;
create policy event_notifications_update_own_or_admin on public.event_notifications for update using (
  user_id = auth.uid() or public.is_admin(auth.uid())
);

drop policy if exists event_notifications_delete_own_or_admin on public.event_notifications;
create policy event_notifications_delete_own_or_admin on public.event_notifications for delete using (
  user_id = auth.uid() or public.is_admin(auth.uid())
);

-- events
-- Select: approved for public; owner; or admin
drop policy if exists events_select_policy on public.events;
create policy events_select_policy on public.events for select using (
  status = 'approved' or user_id = auth.uid() or public.is_admin(auth.uid())
);
-- Insert: authenticated users creating their own rows
drop policy if exists events_insert_self on public.events;
create policy events_insert_self on public.events for insert with check (
  auth.uid() is not null and user_id = auth.uid()
);
-- Update/Delete: owners or admins
drop policy if exists events_update_own_or_admin on public.events;
create policy events_update_own_or_admin on public.events for update using (
  user_id = auth.uid() or public.is_admin(auth.uid())
);

drop policy if exists events_delete_own_or_admin on public.events;
create policy events_delete_own_or_admin on public.events for delete using (
  user_id = auth.uid() or public.is_admin(auth.uid())
);

-- profiles
-- Read: allow all (adjust if you want private profiles)
drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all on public.profiles for select using (true);
-- Insert/Update: only owner
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert with check (user_id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update using (user_id = auth.uid());

-- user_roles
-- Read: admins can read; users can read their own
drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles for select using (
  user_id = auth.uid() or public.is_admin(auth.uid())
);
-- Insert/Update/Delete: admins only
drop policy if exists user_roles_admin_write on public.user_roles;
create policy user_roles_admin_write on public.user_roles for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ========== Validation checks ==========
-- Ensure end datetime is not before start datetime
create or replace function public.validate_event_datetime() returns trigger language plpgsql as $$
begin
  if (make_timestamp(extract(year from new.start_date)::int, extract(month from new.start_date)::int, extract(day from new.start_date)::int,
                     extract(hour from new.start_time)::int, extract(minute from new.start_time)::int, 0)
      >
      make_timestamp(extract(year from new.end_date)::int, extract(month from new.end_date)::int, extract(day from new.end_date)::int,
                     extract(hour from new.end_time)::int, extract(minute from new.end_time)::int, 0)) then
    raise exception 'Event end datetime cannot be before start datetime';
  end if;
  return new;
end $$;

drop trigger if exists events_validate_datetime on public.events;
create trigger events_validate_datetime before insert or update on public.events
for each row execute procedure public.validate_event_datetime();
