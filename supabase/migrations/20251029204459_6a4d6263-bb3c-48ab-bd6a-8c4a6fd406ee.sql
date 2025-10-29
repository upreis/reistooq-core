-- ✅ CORRIGIR CONSTRAINT ÚNICA DA TABELA CONFIGURACOES
-- Problema: A constraint atual só verifica a chave, impedindo que diferentes organizações usem a mesma chave
-- Solução: Remover a constraint antiga e criar uma nova que inclui organization_id

-- Remover a constraint antiga
ALTER TABLE public.configuracoes 
DROP CONSTRAINT IF EXISTS configuracoes_chave_key;

-- Criar nova constraint única que permite a mesma chave para diferentes organizações
ALTER TABLE public.configuracoes 
ADD CONSTRAINT configuracoes_org_chave_unique 
UNIQUE (organization_id, chave);

-- Comentário explicativo
COMMENT ON CONSTRAINT configuracoes_org_chave_unique ON public.configuracoes 
IS 'Garante que cada chave de configuração é única dentro de uma organização, mas permite que diferentes organizações usem as mesmas chaves';