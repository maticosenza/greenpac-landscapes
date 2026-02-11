
-- Create quotation history/follow-up table
CREATE TABLE public.quotation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'status_change', 'note', 'approved', 'rejected'
  old_status TEXT,
  new_status TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotation_history ENABLE ROW LEVEL SECURITY;

-- Customers can view history of their own quotations
CREATE POLICY "Customers can view their quotation history"
  ON public.quotation_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_id AND q.customer_id = auth.uid()
    )
  );

-- Staff can view all history
CREATE POLICY "Staff can view all quotation history"
  ON public.quotation_history FOR SELECT TO authenticated
  USING (has_role('employee'::app_role, auth.uid()) OR has_role('admin'::app_role, auth.uid()));

-- Staff can insert history
CREATE POLICY "Staff can insert quotation history"
  ON public.quotation_history FOR INSERT TO authenticated
  WITH CHECK (has_role('employee'::app_role, auth.uid()) OR has_role('admin'::app_role, auth.uid()));

-- Customers can insert history (for approving/rejecting)
CREATE POLICY "Customers can insert their quotation history"
  ON public.quotation_history FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_id AND q.customer_id = auth.uid()
    )
  );
