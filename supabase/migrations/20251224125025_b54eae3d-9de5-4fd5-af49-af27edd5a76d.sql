-- Create a dedicated bucket for court recordings
INSERT INTO storage.buckets (id, name, public) 
VALUES ('court-recordings', 'court-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload court recordings (using user_id as folder)
CREATE POLICY "Users can upload court recordings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'court-recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view their court recordings
CREATE POLICY "Users can view court recordings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'court-recordings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their court recordings
CREATE POLICY "Users can delete court recordings"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'court-recordings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);