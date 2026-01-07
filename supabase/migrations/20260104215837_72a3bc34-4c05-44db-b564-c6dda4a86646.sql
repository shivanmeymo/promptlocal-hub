-- Fix search_path for app.soft_delete_template
CREATE OR REPLACE FUNCTION app.soft_delete_template(t_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = app, public
AS $function$
  update app.templates set deleted_at = now() where id = t_id and owner_id = auth.uid();
$function$;

-- Fix search_path for app.submit_contact
CREATE OR REPLACE FUNCTION app.submit_contact(p_subject text, p_message text, p_name text DEFAULT NULL::text, p_email text DEFAULT NULL::text, p_meta jsonb DEFAULT '{}'::jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app, public
AS $function$
declare
  new_id bigint;
begin
  insert into app.contact_messages (user_id, name, email, subject, message, meta)
  values (auth.uid(), p_name, p_email, p_subject, p_message, p_meta)
  returning id into new_id;
  return new_id;
end;
$function$;

-- Fix search_path for app.touch_updated_at
CREATE OR REPLACE FUNCTION app.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = app, public
AS $function$
begin
  new.updated_at = now();
  return new;
end
$function$;

-- Fix search_path for public.is_admin
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $function$
  select exists (
    select 1 from public.user_roles r
    where r.user_id = uid and r.role = 'admin'
  );
$function$;