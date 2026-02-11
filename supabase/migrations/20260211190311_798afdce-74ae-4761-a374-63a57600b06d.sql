
-- Create quotation_messages table for in-app chat
CREATE TABLE public.quotation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}'::text[],
  is_from_staff BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotation_messages ENABLE ROW LEVEL SECURITY;

-- Customers can view messages on their own quotations
CREATE POLICY "Customers can view their quotation messages"
ON public.quotation_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quotations q
    WHERE q.id = quotation_messages.quotation_id
    AND q.customer_id = auth.uid()
  )
);

-- Staff can view all messages
CREATE POLICY "Staff can view all quotation messages"
ON public.quotation_messages FOR SELECT
USING (has_role('employee'::app_role, auth.uid()) OR has_role('admin'::app_role, auth.uid()));

-- Staff can insert messages
CREATE POLICY "Staff can insert quotation messages"
ON public.quotation_messages FOR INSERT
WITH CHECK (has_role('employee'::app_role, auth.uid()) OR has_role('admin'::app_role, auth.uid()));

-- Customers can insert messages on their own quotations
CREATE POLICY "Customers can insert their quotation messages"
ON public.quotation_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM quotations q
    WHERE q.id = quotation_messages.quotation_id
    AND q.customer_id = auth.uid()
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotation_messages;
