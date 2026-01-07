-- Fix storage policies for event-images bucket to restrict access to user's own folder

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their event images" ON storage.objects;

-- Create new restrictive policies that enforce user folder ownership

-- Users can only upload to their own folder (path starts with their user_id)
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only update files in their own folder
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only delete files in their own folder
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Keep public read access for event images (this is acceptable for event images)
-- Check if a public read policy already exists, if not create one
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Event images are publicly accessible'
  ) THEN
    EXECUTE 'CREATE POLICY "Event images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = ''event-images'')';
  END IF;
END $$;