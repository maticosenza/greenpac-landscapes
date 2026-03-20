
DROP POLICY "Staff can delete clients" ON public.clients;

CREATE POLICY "Only admins can delete clients"
ON public.clients
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
