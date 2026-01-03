-- Grant admin role to user with email 'shivan.meymo@gmail.com' if the user exists
-- Also provide a helper to grant admin by arbitrary email for future use

create or replace function public.grant_admin_by_email(p_email text)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.user_roles (user_id, role)
  select u.id, 'admin'::public.app_role
  from auth.users u
  where lower(u.email) = lower(p_email)
  and not exists (
    select 1 from public.user_roles r where r.user_id = u.id and r.role = 'admin'
  );
end;
$$;

-- Attempt to grant admin to Shivan if exists
select public.grant_admin_by_email('shivan.meymo@gmail.com');
