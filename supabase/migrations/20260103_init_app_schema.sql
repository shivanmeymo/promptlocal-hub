-- Enable required extension for UUID generation
create extension if not exists pgcrypto;

-- 1) Schema
create schema if not exists app;

-- 2) Tables
-- Profiles (1:1 with auth.users)
create table if not exists app.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  locale text check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Templates: user-owned, optionally public
create table if not exists app.templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  slug text generated always as (regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')) stored,
  description text,
  content jsonb not null,
  is_public boolean not null default false,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists templates_owner_slug_uniq on app.templates(owner_id, slug) where deleted_at is null;
create index if not exists templates_public_idx on app.templates(is_public) where deleted_at is null;
create index if not exists templates_owner_idx on app.templates(owner_id) where deleted_at is null;

-- Template favorites (many-to-many user<>template)
create table if not exists app.template_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null references app.templates(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, template_id)
);

-- Contact messages (can be from logged-in or guests)
create table if not exists app.contact_messages (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  name text,
  email text,
  subject text,
  message text not null,
  meta jsonb,
  status text not null default 'new' check (status in ('new','in_progress','resolved','spam')),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_status_idx on app.contact_messages(status);
create index if not exists contact_messages_user_idx on app.contact_messages(user_id);

-- Optional CMS-like pages (Terms/Data Integrity)
create table if not exists app.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body_md text not null,
  is_published boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 3) RLS enable
alter table app.profiles enable row level security;
alter table app.templates enable row level security;
alter table app.template_favorites enable row level security;
alter table app.contact_messages enable row level security;
alter table app.pages enable row level security;

-- 4) RLS policies
-- Profiles
drop policy if exists profiles_select_all on app.profiles;
create policy profiles_select_all
on app.profiles for select
using (true);

drop policy if exists profiles_update_own on app.profiles;
create policy profiles_update_own
on app.profiles for update
using (auth.uid() = user_id);

drop policy if exists profiles_insert_self on app.profiles;
create policy profiles_insert_self
on app.profiles for insert
with check (auth.uid() = user_id);

-- Templates
drop policy if exists templates_select_public_or_own on app.templates;
create policy templates_select_public_or_own
on app.templates for select
using (
  deleted_at is null and (is_public = true or owner_id = auth.uid())
);

drop policy if exists templates_insert_own on app.templates;
create policy templates_insert_own
on app.templates for insert
with check (owner_id = auth.uid());

drop policy if exists templates_update_own on app.templates;
create policy templates_update_own
on app.templates for update
using (owner_id = auth.uid());

drop policy if exists templates_delete_own on app.templates;
create policy templates_delete_own
on app.templates for delete
using (owner_id = auth.uid());

-- Favorites
drop policy if exists favorites_select_own on app.template_favorites;
create policy favorites_select_own
on app.template_favorites for select
using (user_id = auth.uid());

drop policy if exists favorites_insert_own on app.template_favorites;
create policy favorites_insert_own
on app.template_favorites for insert
with check (user_id = auth.uid());

drop policy if exists favorites_delete_own on app.template_favorites;
create policy favorites_delete_own
on app.template_favorites for delete
using (user_id = auth.uid());

-- Contact messages
-- Allow inserts from anyone (even anon)
drop policy if exists contact_messages_insert_all on app.contact_messages;
create policy contact_messages_insert_all
on app.contact_messages for insert
with check (true);

-- By default, do not allow select/update/delete (handle via admin function or Edge Functions)

-- Pages
drop policy if exists pages_select_published on app.pages;
create policy pages_select_published
on app.pages for select
using (is_published = true);

-- 5) Triggers for updated_at
create or replace function app.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists profiles_touch on app.profiles;
create trigger profiles_touch before update on app.profiles
for each row execute procedure app.touch_updated_at();

drop trigger if exists templates_touch on app.templates;
create trigger templates_touch before update on app.templates
for each row execute procedure app.touch_updated_at();

drop trigger if exists pages_touch on app.pages;
create trigger pages_touch before update on app.pages
for each row execute procedure app.touch_updated_at();

-- 6) RPC helpers
-- Soft delete template (owner only via RLS)
create or replace function app.soft_delete_template(t_id uuid)
returns void
language sql
security definer
as $$
  update app.templates set deleted_at = now() where id = t_id and owner_id = auth.uid();
$$;

-- Submit contact (sets user_id if logged in)
create or replace function app.submit_contact(
  p_subject text,
  p_message text,
  p_name text default null,
  p_email text default null,
  p_meta jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
as $$
declare
  new_id bigint;
begin
  insert into app.contact_messages (user_id, name, email, subject, message, meta)
  values (auth.uid(), p_name, p_email, p_subject, p_message, p_meta)
  returning id into new_id;
  return new_id;
end;
$$;

-- 7) Optional: JSONB index for content if you plan to filter by content fields
-- create index if not exists templates_content_gin on app.templates using gin (content);
