-- Ensure creator is set automatically on insert for notes
-- Safe to re-run
CREATE OR REPLACE FUNCTION public.set_notes_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  IF NEW.last_edited_by IS NULL THEN
    NEW.last_edited_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger to avoid duplicates
DROP TRIGGER IF EXISTS set_notes_creator_trigger ON public.notes;
CREATE TRIGGER set_notes_creator_trigger
  BEFORE INSERT ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_notes_creator();

-- Keep existing organization and updated_at triggers intact (created in previous migration)
-- No changes to RLS policies needed; they already match created_by = auth.uid() and org via set_notes_organization()
