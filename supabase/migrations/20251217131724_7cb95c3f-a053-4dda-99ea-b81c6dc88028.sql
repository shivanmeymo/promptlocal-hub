-- Add length constraints to contact_messages table
ALTER TABLE public.contact_messages 
ADD CONSTRAINT contact_name_length CHECK (length(name) <= 100),
ADD CONSTRAINT contact_email_length CHECK (length(email) <= 255),
ADD CONSTRAINT contact_phone_length CHECK (length(phone) <= 20),
ADD CONSTRAINT contact_message_length CHECK (length(message) <= 5000),
ADD CONSTRAINT contact_category_length CHECK (length(category) <= 50);

-- Create a view for public events that excludes sensitive fields
CREATE OR REPLACE VIEW public.public_events AS
SELECT 
  id, user_id, organizer_name, organizer_email, organizer_description,
  organizer_website, title, description, start_date, start_time, 
  end_date, end_time, location, category, is_free, price, 
  image_url, status, created_at, updated_at, is_online, 
  is_recurring, recurring_pattern, other_category, approved_at
  -- Excluded: approval_token, admin_notes, approved_by
FROM public.events
WHERE status = 'approved';

-- Grant access to the view
GRANT SELECT ON public.public_events TO anon, authenticated;