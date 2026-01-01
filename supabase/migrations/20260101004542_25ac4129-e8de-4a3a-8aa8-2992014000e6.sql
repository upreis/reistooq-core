-- Adicionar campos de dados da empresa na tabela organizacoes
ALTER TABLE public.organizacoes 
ADD COLUMN IF NOT EXISTS fantasia TEXT,
ADD COLUMN IF NOT EXISTS razao_social TEXT,
ADD COLUMN IF NOT EXISTS endereco TEXT,
ADD COLUMN IF NOT EXISTS endereco_numero TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS complemento TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS uf TEXT,
ADD COLUMN IF NOT EXISTS telefone TEXT,
ADD COLUMN IF NOT EXISTS fax TEXT,
ADD COLUMN IF NOT EXISTS celular TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS segmento TEXT,
ADD COLUMN IF NOT EXISTS tipo_pessoa TEXT DEFAULT 'PJ',
ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT,
ADD COLUMN IF NOT EXISTS ie_isento BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS inscricao_municipal TEXT,
ADD COLUMN IF NOT EXISTS cnae TEXT,
ADD COLUMN IF NOT EXISTS regime_tributario TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS admin_nome TEXT,
ADD COLUMN IF NOT EXISTS admin_email TEXT,
ADD COLUMN IF NOT EXISTS admin_celular TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Criar índice para busca por fantasia (usado no slug)
CREATE INDEX IF NOT EXISTS idx_organizacoes_fantasia ON public.organizacoes(fantasia);

-- Atualizar função de gerar slug para usar fantasia se disponível
CREATE OR REPLACE FUNCTION generate_org_slug(org_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Converter para lowercase, remover acentos e caracteres especiais
  base_slug := lower(trim(org_name));
  base_slug := translate(base_slug, 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'aaaaaeeeeiiiioooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN');
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

-- Função para atualizar slug quando fantasia mudar
CREATE OR REPLACE FUNCTION update_org_slug_from_fantasia()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se fantasia foi alterada e não é nula, atualizar slug
  IF NEW.fantasia IS NOT NULL AND NEW.fantasia != '' AND 
     (OLD.fantasia IS NULL OR NEW.fantasia != OLD.fantasia) THEN
    NEW.slug := generate_org_slug(NEW.fantasia);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_slug_from_fantasia ON public.organizacoes;
CREATE TRIGGER trigger_update_slug_from_fantasia
  BEFORE UPDATE ON public.organizacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_org_slug_from_fantasia();

-- Função RPC para buscar dados completos da organização atual
CREATE OR REPLACE FUNCTION public.get_current_organization_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_org_data JSONB;
BEGIN
  v_org_id := get_current_org_id();
  IF v_org_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT jsonb_build_object(
    'id', id,
    'nome', nome,
    'fantasia', fantasia,
    'razao_social', razao_social,
    'cnpj', cnpj,
    'slug', slug,
    'endereco', endereco,
    'endereco_numero', endereco_numero,
    'bairro', bairro,
    'complemento', complemento,
    'cidade', cidade,
    'cep', cep,
    'uf', uf,
    'telefone', telefone,
    'fax', fax,
    'celular', celular,
    'email', email,
    'website', website,
    'segmento', segmento,
    'tipo_pessoa', tipo_pessoa,
    'inscricao_estadual', inscricao_estadual,
    'ie_isento', ie_isento,
    'inscricao_municipal', inscricao_municipal,
    'cnae', cnae,
    'regime_tributario', regime_tributario,
    'logo_url', logo_url,
    'admin_nome', admin_nome,
    'admin_email', admin_email,
    'admin_celular', admin_celular,
    'onboarding_completed', onboarding_completed,
    'plano', plano,
    'ativo', ativo,
    'created_at', created_at
  ) INTO v_org_data
  FROM organizacoes
  WHERE id = v_org_id;
  
  RETURN v_org_data;
END;
$$;

-- Função RPC para atualizar dados da organização
CREATE OR REPLACE FUNCTION public.update_organization_data(p_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  v_org_id := get_current_org_id();
  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organização não encontrada');
  END IF;
  
  UPDATE organizacoes SET
    fantasia = COALESCE(p_data->>'fantasia', fantasia),
    razao_social = COALESCE(p_data->>'razao_social', razao_social),
    cnpj = COALESCE(p_data->>'cnpj', cnpj),
    endereco = COALESCE(p_data->>'endereco', endereco),
    endereco_numero = COALESCE(p_data->>'endereco_numero', endereco_numero),
    bairro = COALESCE(p_data->>'bairro', bairro),
    complemento = COALESCE(p_data->>'complemento', complemento),
    cidade = COALESCE(p_data->>'cidade', cidade),
    cep = COALESCE(p_data->>'cep', cep),
    uf = COALESCE(p_data->>'uf', uf),
    telefone = COALESCE(p_data->>'telefone', telefone),
    fax = COALESCE(p_data->>'fax', fax),
    celular = COALESCE(p_data->>'celular', celular),
    email = COALESCE(p_data->>'email', email),
    website = COALESCE(p_data->>'website', website),
    segmento = COALESCE(p_data->>'segmento', segmento),
    tipo_pessoa = COALESCE(p_data->>'tipo_pessoa', tipo_pessoa),
    inscricao_estadual = COALESCE(p_data->>'inscricao_estadual', inscricao_estadual),
    ie_isento = COALESCE((p_data->>'ie_isento')::boolean, ie_isento),
    inscricao_municipal = COALESCE(p_data->>'inscricao_municipal', inscricao_municipal),
    cnae = COALESCE(p_data->>'cnae', cnae),
    regime_tributario = COALESCE(p_data->>'regime_tributario', regime_tributario),
    logo_url = COALESCE(p_data->>'logo_url', logo_url),
    admin_nome = COALESCE(p_data->>'admin_nome', admin_nome),
    admin_email = COALESCE(p_data->>'admin_email', admin_email),
    admin_celular = COALESCE(p_data->>'admin_celular', admin_celular),
    onboarding_completed = COALESCE((p_data->>'onboarding_completed')::boolean, onboarding_completed),
    onboarding_completed_at = CASE 
      WHEN (p_data->>'onboarding_completed')::boolean = true AND onboarding_completed = false 
      THEN now() 
      ELSE onboarding_completed_at 
    END,
    updated_at = now()
  WHERE id = v_org_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;