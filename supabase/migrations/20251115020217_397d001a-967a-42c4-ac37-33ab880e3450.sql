-- Allow authenticated users to insert session replay data into knowledge_base
-- This is safe because:
-- 1. Users can only insert into their own organization (enforced by get_current_org_id())
-- 2. Session replay is a legitimate use case for knowledge_base
-- 3. The edge function validates the user and organization before inserting

CREATE POLICY "Users can insert session replay data into their org"
ON public.knowledge_base
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = get_current_org_id() 
  AND source = 'session_replay'
);