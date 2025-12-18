-- Enable RLS on attendees table (if not already enabled)
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (for clean migration)
DROP POLICY IF EXISTS "Allow public read access to attendees" ON attendees;

-- Create policy to allow public SELECT on attendees table
-- This enables the validateCode join to work properly
CREATE POLICY "Allow public read access to attendees"
ON attendees
FOR SELECT
TO public
USING (true);

-- Verify the policy was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'attendees' 
    AND policyname = 'Allow public read access to attendees'
  ) THEN
    RAISE NOTICE 'Policy "Allow public read access to attendees" created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create policy';
  END IF;
END $$;
