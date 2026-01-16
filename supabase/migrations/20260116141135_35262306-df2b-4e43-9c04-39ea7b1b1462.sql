-- Drop the old permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can insert quotations" ON public.quotations;

-- Create new INSERT policy that requires authentication and sets customer_id to auth.uid()
-- Users can only insert quotations for themselves
CREATE POLICY "Authenticated users can insert their own quotations"
ON public.quotations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND customer_id = auth.uid());

-- The existing SELECT policies are already secure:
-- - "Customers can view their own quotations" USING (customer_id = auth.uid()) - requires auth
-- - "Employees can view all quotations" USING (has_role(...)) - requires auth
-- No changes needed for SELECT policies