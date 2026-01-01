-- 1. Adicionar campo slug na tabela organizacoes
ALTER TABLE public.organizacoes ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. Gerar slugs para organizações existentes baseado no nome
CREATE OR REPLACE FUNCTION generate_org_slug(org_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Converter para lowercase, remover acentos e caracteres especiais
  base_slug := lower(trim(org_name));
  base_slug := translate(base_slug, 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiioooooouuuucn');
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '', 'g');
  
  -- Se ficou vazio, usar 'org'
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'org';
  END IF;
  
  -- Garantir slug único
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.organizacoes WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || counter::text;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Atualizar organizações existentes que não têm slug
UPDATE public.organizacoes 
SET slug = generate_org_slug(nome)
WHERE slug IS NULL;

-- Tornar slug NOT NULL após popular dados existentes
ALTER TABLE public.organizacoes ALTER COLUMN slug SET NOT NULL;

-- 3. Adicionar campo username na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- 4. Adicionar campo username na tabela invitations (ao invés de exigir email)
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.invitations ALTER COLUMN email DROP NOT NULL;

-- 5. Criar índice para busca por username
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_invitations_username ON public.invitations(username);

-- 6. Trigger para gerar slug automaticamente ao criar organização
CREATE OR REPLACE FUNCTION set_org_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_org_slug(NEW.nome);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_org_slug ON public.organizacoes;
CREATE TRIGGER trigger_set_org_slug
  BEFORE INSERT ON public.organizacoes
  FOR EACH ROW
  EXECUTE FUNCTION set_org_slug();

-- 7. Função para validar formato de username
CREATE OR REPLACE FUNCTION validate_username(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Username deve ter 3-30 caracteres, apenas letras, números e underscore
  RETURN p_username ~ '^[a-zA-Z][a-zA-Z0-9_]{2,29}$';
END;
$$;

-- 8. Atualizar função de validação de convite para suportar username
CREATE OR REPLACE FUNCTION public.validate_invitation_by_username(
  p_username TEXT,
  p_organization_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_user RECORD;
BEGIN
  -- Validar formato do username
  IF NOT validate_username(p_username) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Nome de usuário inválido. Use 3-30 caracteres, começando com letra, apenas letras, números e underscore.'
    );
  END IF;
  
  -- Verificar se username já existe na mesma organização
  SELECT p.id, p.organizacao_id, p.username
  INTO existing_user
  FROM profiles p
  WHERE p.username = p_username AND p.organizacao_id = p_organization_id;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Este nome de usuário já está em uso na sua organização'
    );
  END IF;
  
  -- Verificar se já existe convite pendente com mesmo username na mesma org
  IF EXISTS (
    SELECT 1 FROM invitations 
    WHERE username = p_username 
    AND organization_id = p_organization_id
    AND status = 'pending'
  ) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Já existe um convite pendente para este nome de usuário'
    );
  END IF;
  
  RETURN jsonb_build_object('valid', true, 'message', 'Username disponível');
END;
$$;