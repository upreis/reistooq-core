-- Remove a função de verificação que pode estar causando problemas de tipo
DROP FUNCTION IF EXISTS public.verify_view_security();