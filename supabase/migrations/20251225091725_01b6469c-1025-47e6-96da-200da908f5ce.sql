-- Public-facing copy of approved events (no PII like organizer_email)
CREATE TABLE IF NOT EXISTS public.events_public (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  start_date date NOT NULL,
  start_time time NOT NULL,
  end_date date NOT NULL,
  end_time time NOT NULL,
  location text NOT NULL,
  category public.event_category NOT NULL,
  other_category text NULL,
  is_free boolean NOT NULL DEFAULT true,
  price numeric NULL,
  image_url text NULL,
  organizer_name text NOT NULL,
  organizer_description text NULL,
  organizer_website text NULL,
  status public.event_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS idx_events_public_start_date ON public.events_public (start_date);

ALTER TABLE public.events_public ENABLE ROW LEVEL SECURITY;

-- Public read access (table only contains approved events)
DO $$ BEGIN
  CREATE POLICY "Public can view events_public"
  ON public.events_public
  FOR SELECT
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only admins can mutate from the client (writes are maintained by triggers)
DO $$ BEGIN
  CREATE POLICY "Admins can insert events_public"
  ON public.events_public
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update events_public"
  ON public.events_public
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete events_public"
  ON public.events_public
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Keep events_public in sync with events approvals
CREATE OR REPLACE FUNCTION public.sync_events_public_from_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.events_public WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  -- For INSERT/UPDATE: publish only approved events
  IF NEW.status = 'approved' THEN
    INSERT INTO public.events_public (
      id, title, description, start_date, start_time, end_date, end_time,
      location, category, other_category, is_free, price, image_url,
      organizer_name, organizer_description, organizer_website,
      status, created_at, updated_at, approved_at
    )
    VALUES (
      NEW.id, NEW.title, NEW.description, NEW.start_date, NEW.start_time, NEW.end_date, NEW.end_time,
      NEW.location, NEW.category, NEW.other_category, NEW.is_free, NEW.price, NEW.image_url,
      NEW.organizer_name, NEW.organizer_description, NEW.organizer_website,
      NEW.status, NEW.created_at, NEW.updated_at, NEW.approved_at
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      start_date = EXCLUDED.start_date,
      start_time = EXCLUDED.start_time,
      end_date = EXCLUDED.end_date,
      end_time = EXCLUDED.end_time,
      location = EXCLUDED.location,
      category = EXCLUDED.category,
      other_category = EXCLUDED.other_category,
      is_free = EXCLUDED.is_free,
      price = EXCLUDED.price,
      image_url = EXCLUDED.image_url,
      organizer_name = EXCLUDED.organizer_name,
      organizer_description = EXCLUDED.organizer_description,
      organizer_website = EXCLUDED.organizer_website,
      status = EXCLUDED.status,
      created_at = EXCLUDED.created_at,
      updated_at = EXCLUDED.updated_at,
      approved_at = EXCLUDED.approved_at;
  ELSE
    -- Not approved: ensure it is not publicly visible
    DELETE FROM public.events_public WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_events_public_from_events ON public.events;
CREATE TRIGGER trg_sync_events_public_from_events
AFTER INSERT OR UPDATE OR DELETE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.sync_events_public_from_events();

-- Backfill existing approved events
INSERT INTO public.events_public (
  id, title, description, start_date, start_time, end_date, end_time,
  location, category, other_category, is_free, price, image_url,
  organizer_name, organizer_description, organizer_website,
  status, created_at, updated_at, approved_at
)
SELECT
  e.id, e.title, e.description, e.start_date, e.start_time, e.end_date, e.end_time,
  e.location, e.category, e.other_category, e.is_free, e.price, e.image_url,
  e.organizer_name, e.organizer_description, e.organizer_website,
  e.status, e.created_at, e.updated_at, e.approved_at
FROM public.events e
WHERE e.status = 'approved'
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  start_time = EXCLUDED.start_time,
  end_date = EXCLUDED.end_date,
  end_time = EXCLUDED.end_time,
  location = EXCLUDED.location,
  category = EXCLUDED.category,
  other_category = EXCLUDED.other_category,
  is_free = EXCLUDED.is_free,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  organizer_name = EXCLUDED.organizer_name,
  organizer_description = EXCLUDED.organizer_description,
  organizer_website = EXCLUDED.organizer_website,
  status = EXCLUDED.status,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  approved_at = EXCLUDED.approved_at;
