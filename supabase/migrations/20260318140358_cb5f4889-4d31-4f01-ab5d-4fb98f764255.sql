
-- Add status column to clients
ALTER TABLE public.clients ADD COLUMN status text NOT NULL DEFAULT 'activo';

-- Create client_notes table for follow-up history
CREATE TABLE public.client_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  note text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;

-- All staff can view client notes
CREATE POLICY "Staff can view client notes"
  ON public.client_notes FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'employee'::app_role) OR 
    has_role(auth.uid(), 'vendedor'::app_role)
  );

-- All staff can insert client notes
CREATE POLICY "Staff can insert client notes"
  ON public.client_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = user_id) AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'employee'::app_role) OR 
      has_role(auth.uid(), 'vendedor'::app_role)
    )
  );

-- All staff can delete their own notes
CREATE POLICY "Staff can delete own client notes"
  ON public.client_notes FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
  );
