-- Primeiro, vamos verificar se o trigger existe e criar caso não exista
DROP TRIGGER IF EXISTS set_notes_organization_trigger ON public.notes;

-- Criar o trigger para definir organization_id automaticamente
CREATE TRIGGER set_notes_organization_trigger
  BEFORE INSERT ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_notes_organization();

-- Criar o trigger para atualizar updated_at automaticamente  
DROP TRIGGER IF EXISTS update_notes_updated_at_trigger ON public.notes;
CREATE TRIGGER update_notes_updated_at_trigger
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notes_updated_at();

-- Remover as políticas RLS existentes problemáticas
DROP POLICY IF EXISTS "notes_own_insert" ON public.notes;
DROP POLICY IF EXISTS "notes_own_select" ON public.notes;
DROP POLICY IF EXISTS "notes_own_update" ON public.notes;
DROP POLICY IF EXISTS "notes_own_delete" ON public.notes;

-- Criar novas políticas RLS mais robustas
CREATE POLICY "notes_insert_with_org_and_user" ON public.notes
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_current_org_id() AND 
    created_by = auth.uid()
  );

CREATE POLICY "notes_select_accessible" ON public.notes
  FOR SELECT
  USING (
    organization_id = public.get_current_org_id() AND (
      created_by = auth.uid() OR 
      auth.uid() = ANY(shared_with) OR 
      is_shared = true
    )
  );

CREATE POLICY "notes_update_by_creator_or_shared" ON public.notes
  FOR UPDATE
  USING (
    organization_id = public.get_current_org_id() AND (
      created_by = auth.uid() OR 
      auth.uid() = ANY(shared_with)
    )
  );

CREATE POLICY "notes_delete_by_creator" ON public.notes
  FOR DELETE
  USING (
    organization_id = public.get_current_org_id() AND 
    created_by = auth.uid()
  );