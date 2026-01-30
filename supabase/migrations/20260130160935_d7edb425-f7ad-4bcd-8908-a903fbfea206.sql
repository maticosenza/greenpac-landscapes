-- Drop the existing INSERT policy that doesn't properly handle employee cases
DROP POLICY IF EXISTS "Authenticated users can insert their own quotations" ON quotations;

-- Create policy for customers to insert their own quotations ONLY
-- This ensures customers can only create quotations where they are the customer
CREATE POLICY "Customers can insert their own quotations"
ON quotations FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND customer_id IS NOT NULL
  AND customer_id = auth.uid()
);

-- Create policy for employees/admins to insert quotations for any customer
-- Staff can create quotations on behalf of customers
CREATE POLICY "Staff can insert quotations"
ON quotations FOR INSERT
WITH CHECK (
  has_role('employee'::app_role, auth.uid()) OR has_role('admin'::app_role, auth.uid())
);