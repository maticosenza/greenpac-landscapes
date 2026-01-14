-- Add reply columns to contact_inquiries
ALTER TABLE public.contact_inquiries
  ADD COLUMN IF NOT EXISTS reply TEXT,
  ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS replied_by UUID REFERENCES auth.users(id);

-- Add constraint for reply length
ALTER TABLE public.contact_inquiries
  ADD CONSTRAINT contact_reply_length CHECK (reply IS NULL OR char_length(reply) <= 5000);