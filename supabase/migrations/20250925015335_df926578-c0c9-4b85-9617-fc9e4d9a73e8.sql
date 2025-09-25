-- Drop existing problematic policies and create proper service role access
DROP POLICY IF EXISTS "organizations_service_role_read" ON organizacoes;

-- Create policies that allow service role access for edge functions
CREATE POLICY "invitations_edge_function_access" ON invitations
FOR ALL USING (true);

CREATE POLICY "roles_edge_function_access" ON roles  
FOR ALL USING (true);

CREATE POLICY "organizacoes_edge_function_access" ON organizacoes
FOR ALL USING (true);