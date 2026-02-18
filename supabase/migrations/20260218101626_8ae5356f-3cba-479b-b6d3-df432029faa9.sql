
-- 1) Fix contact_inquiries: drop the overly permissive "Require authentication" policy
-- Staff already have their own SELECT policy via has_role checks
DROP POLICY IF EXISTS "Require authentication for contact inquiries" ON public.contact_inquiries;

-- 2) Add UPDATE/DELETE policies for quotation_messages
-- Authors can update their own messages (within any time)
CREATE POLICY "Authors can update own messages"
ON public.quotation_messages
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Staff can delete any message (moderation)
CREATE POLICY "Staff can delete messages"
ON public.quotation_messages
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'employee'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Authors can delete their own messages
CREATE POLICY "Authors can delete own messages"
ON public.quotation_messages
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
