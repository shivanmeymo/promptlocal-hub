-- Fix search_path for validate_event_datetime function
CREATE OR REPLACE FUNCTION public.validate_event_datetime()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
begin
  if (make_timestamp(extract(year from new.start_date)::int, extract(month from new.start_date)::int, extract(day from new.start_date)::int,
                     extract(hour from new.start_time)::int, extract(minute from new.start_time)::int, 0)
      >
      make_timestamp(extract(year from new.end_date)::int, extract(month from new.end_date)::int, extract(day from new.end_date)::int,
                     extract(hour from new.end_time)::int, extract(minute from new.end_time)::int, 0)) then
    raise exception 'Event end datetime cannot be before start datetime';
  end if;
  return new;
end $function$;

-- Fix search_path for touch_updated_at function  
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
begin
  new.updated_at = now();
  return new;
end $function$;