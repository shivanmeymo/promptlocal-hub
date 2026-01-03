-- Additional app tables: ai_usage, contact_messages (already exists), events, event_notifications,
-- events_public_profiles_user_roles
-- Assumes schema app exists and auth.users available.
create extension if not exists pgcrypto;

-- 1) ai_usage: track AI feature usage by user
create table if not exists app.ai_usage (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  feature text not null,                   -- e.g., 'summary', 'recommendations'
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  requests_count integer not null default 1,
  cost_cents integer not null default 0,   -- store cost in integer cents to avoid float
  status text not null default 'ok' check (status in ('ok','error','rate_limited')),
  meta jsonb,                              -- model name, latency, prompt hash, etc.
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_user_idx on app.ai_usage(user_id);
create index if not exists ai_usage_feature_idx on app.ai_usage(feature);
create index if not exists ai_usage_created_idx on app.ai_usage(created_at);

-- 2) events: user-created events
create table if not exists app.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  slug text generated always as (regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')) stored,
  description text,
  location text,
  latitude double precision,
  longitude double precision,
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text,
  visibility text not null default 'public' check (visibility in ('public','unlisted','private')),
  status text not null default 'draft' check (status in ('draft','published','cancelled')),
  capacity integer check (capacity is null or capacity >= 0),
  rsvp_count integer not null default 0,
  cover_url text,
  tags text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index if not exists events_owner_slug_uniq on app.events(owner_id, slug) where deleted_at is null;
create index if not exists events_owner_idx on app.events(owner_id) where deleted_at is null;
create index if not exists events_visibility_idx on app.events(visibility) where deleted_at is null;
create index if not exists events_time_idx on app.events(starts_at);

-- 3) event_notifications: notifications related to events (email/push/etc.)
create table if not exists app.event_notifications (
  id bigserial primary key,
  event_id uuid not null references app.events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('reminder','update','cancellation','custom')),
  channel text not null check (channel in ('email','push','sms','in_app')),
  payload jsonb,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  error text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists event_notifications_event_idx on app.event_notifications(event_id);
create index if not exists event_notifications_user_idx on app.event_notifications(user_id);
create index if not exists event_notifications_status_idx on app.event_notifications(status);

-- 4) events_public_profiles_user_roles: map event participants/roles
-- Note: name kept as requested; effectively an event_user_roles bridge
create table if not exists app.events_public_profiles_user_roles (
  event_id uuid not null references app.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','host','editor','viewer','attendee')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id, role)
);
create index if not exists eppur_user_idx on app.events_public_profiles_user_roles(user_id);
create index if not exists eppur_event_idx on app.events_public_profiles_user_roles(event_id);

-- 5) Enable RLS
alter table app.ai_usage enable row level security;
alter table app.events enable row level security;
alter table app.event_notifications enable row level security;
alter table app.events_public_profiles_user_roles enable row level security;

-- 6) Policies
-- ai_usage: users can read/write their own usage rows
drop policy if exists ai_usage_select_own on app.ai_usage;
create policy ai_usage_select_own on app.ai_usage for select using (user_id = auth.uid());

drop policy if exists ai_usage_insert_own on app.ai_usage;
create policy ai_usage_insert_own on app.ai_usage for insert with check (user_id = auth.uid());

drop policy if exists ai_usage_update_own on app.ai_usage;
create policy ai_usage_update_own on app.ai_usage for update using (user_id = auth.uid());

-- events: read public or own; write only owner
drop policy if exists events_select_public_or_own on app.events;
create policy events_select_public_or_own on app.events for select
using (
  deleted_at is null and (
    visibility = 'public' or owner_id = auth.uid() or
    exists (
      select 1 from app.events_public_profiles_user_roles r
      where r.event_id = id and r.user_id = auth.uid()
    )
  )
);

drop policy if exists events_insert_own on app.events;
create policy events_insert_own on app.events for insert with check (owner_id = auth.uid());

drop policy if exists events_update_owner on app.events;
create policy events_update_owner on app.events for update using (owner_id = auth.uid());

drop policy if exists events_delete_owner on app.events;
create policy events_delete_owner on app.events for delete using (owner_id = auth.uid());

-- event_notifications: creators/owners can see; inserts typically from server (Edge Function)
drop policy if exists event_notifications_select_access on app.event_notifications;
create policy event_notifications_select_access on app.event_notifications for select
using (
  exists (select 1 from app.events e where e.id = event_id and (e.owner_id = auth.uid() or e.visibility = 'public'))
  or user_id = auth.uid()
);

-- events_public_profiles_user_roles: users can see their own roles; owners can see all for their events
drop policy if exists eppur_select_own_or_owner on app.events_public_profiles_user_roles;
create policy eppur_select_own_or_owner on app.events_public_profiles_user_roles for select
using (
  user_id = auth.uid() or exists (select 1 from app.events e where e.id = event_id and e.owner_id = auth.uid())
);

drop policy if exists eppur_insert_owner_only on app.events_public_profiles_user_roles;
create policy eppur_insert_owner_only on app.events_public_profiles_user_roles for insert
with check (
  exists (select 1 from app.events e where e.id = event_id and e.owner_id = auth.uid())
);

drop policy if exists eppur_delete_owner_only on app.events_public_profiles_user_roles;
create policy eppur_delete_owner_only on app.events_public_profiles_user_roles for delete
using (
  exists (select 1 from app.events e where e.id = event_id and e.owner_id = auth.uid())
);

-- 7) updated_at trigger for events
create or replace function app.touch_events_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists events_touch on app.events;
create trigger events_touch before update on app.events
for each row execute procedure app.touch_events_updated_at();
