-- Add is_archived column to quotations table
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Add is_archived column to contact_inquiries table  
ALTER TABLE public.contact_inquiries ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Create DELETE policy for quotations (staff only)
CREATE POLICY "Staff can delete quotations"
ON public.quotations
FOR DELETE
USING (has_role('employee'::app_role, auth.uid()) OR has_role('admin'::app_role, auth.uid()));

-- Create DELETE policy for contact_inquiries (staff only)
CREATE POLICY "Staff can delete contact inquiries"
ON public.contact_inquiries
FOR DELETE
USING (has_role('employee'::app_role, auth.uid()) OR has_role('admin'::app_role, auth.uid()));