-- Remove duplicate INSERT policy
DROP POLICY IF EXISTS "Anyone can submit quotations" ON public.quotations;

-- Add database constraints for server-side validation
ALTER TABLE public.quotations
  ADD CONSTRAINT quotations_client_name_length CHECK (char_length(client_name) BETWEEN 2 AND 100),
  ADD CONSTRAINT quotations_client_email_format CHECK (client_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT quotations_client_email_length CHECK (char_length(client_email) <= 255),
  ADD CONSTRAINT quotations_client_phone_length CHECK (client_phone IS NULL OR char_length(client_phone) <= 50),
  ADD CONSTRAINT quotations_company_length CHECK (company IS NULL OR char_length(company) <= 100),
  ADD CONSTRAINT quotations_message_length CHECK (message IS NULL OR char_length(message) <= 1000);

-- Add assigned_to column for employee quotation assignment
ALTER TABLE public.quotations 
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);

-- Add comment for clarity on the INSERT policy
COMMENT ON POLICY "Anyone can insert quotations" ON public.quotations IS 
  'Allows public quotation form submissions - intentionally permits unauthenticated inserts for quotation requests. Protected by database constraints for validation.';

-- Add constraint for contact_inquiries as well
ALTER TABLE public.contact_inquiries
  ADD CONSTRAINT contact_name_length CHECK (char_length(name) BETWEEN 2 AND 100),
  ADD CONSTRAINT contact_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT contact_email_length CHECK (char_length(email) <= 255),
  ADD CONSTRAINT contact_phone_length CHECK (phone IS NULL OR char_length(phone) <= 50),
  ADD CONSTRAINT contact_message_length CHECK (char_length(message) BETWEEN 1 AND 2000);