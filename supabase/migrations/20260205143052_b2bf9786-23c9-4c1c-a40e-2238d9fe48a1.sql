-- Add attachments column to quotations table
ALTER TABLE public.quotations 
ADD COLUMN attachments text[] DEFAULT '{}'::text[];

-- Create storage bucket for quotation attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('quotation-attachments', 'quotation-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for quotation attachments bucket
-- Staff can upload attachments
CREATE POLICY "Staff can upload quotation attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'quotation-attachments' 
  AND (has_role('employee'::app_role, auth.uid()) OR has_role('admin'::app_role, auth.uid()))
);

-- Staff can view attachments
CREATE POLICY "Staff can view quotation attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'quotation-attachments' 
  AND (has_role('employee'::app_role, auth.uid()) OR has_role('admin'::app_role, auth.uid()))
);

-- Staff can delete attachments
CREATE POLICY "Staff can delete quotation attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'quotation-attachments' 
  AND (has_role('employee'::app_role, auth.uid()) OR has_role('admin'::app_role, auth.uid()))
);