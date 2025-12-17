-- Fix event_notifications INSERT policy to validate user ownership
DROP POLICY IF EXISTS "Anyone can create notifications" ON public.event_notifications;

CREATE POLICY "Anyone can create notifications"
ON public.event_notifications FOR INSERT
WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Fix storage policies with path-based access control
-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their event images" ON storage.objects;

-- Create new policies with user folder enforcement
CREATE POLICY "Users upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);