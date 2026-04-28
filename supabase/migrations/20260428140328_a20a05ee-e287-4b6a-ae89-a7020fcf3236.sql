-- Allow any authenticated user to upload and view chat attachments for quotations.
-- The path convention is `chat/<filename>`. Other paths remain staff-only.

DROP POLICY IF EXISTS "Staff can upload quotation attachments" ON storage.objects;
DROP POLICY IF EXISTS "Staff can view quotation attachments" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete quotation attachments" ON storage.objects;

-- Authenticated users (clients, vendedor, employee, admin) can upload to chat/
CREATE POLICY "Authenticated can upload quotation chat attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'quotation-attachments'
  AND (
    (storage.foldername(name))[1] = 'chat'
    OR has_role('employee'::app_role, auth.uid())
    OR has_role('admin'::app_role, auth.uid())
    OR has_role('vendedor'::app_role, auth.uid())
  )
);

-- Authenticated users can view quotation attachments (signed URLs are used).
CREATE POLICY "Authenticated can view quotation attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'quotation-attachments'
);

-- Staff (and vendedor) can delete quotation attachments.
CREATE POLICY "Staff can delete quotation attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'quotation-attachments'
  AND (
    has_role('employee'::app_role, auth.uid())
    OR has_role('admin'::app_role, auth.uid())
    OR has_role('vendedor'::app_role, auth.uid())
    OR owner = auth.uid()
  )
);