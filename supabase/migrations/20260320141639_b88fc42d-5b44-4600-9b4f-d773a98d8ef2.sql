
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

-- Create storage bucket for spare part images
INSERT INTO storage.buckets (id, name, public) VALUES ('spare-part-images', 'spare-part-images', true) ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Staff can upload spare part images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'spare-part-images');

-- Allow public read
CREATE POLICY "Public can view spare part images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'spare-part-images');

-- Allow authenticated users to update/delete their uploads
CREATE POLICY "Staff can update spare part images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'spare-part-images');

CREATE POLICY "Staff can delete spare part images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'spare-part-images');
