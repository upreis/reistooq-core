-- Corrigir RLS de reclamacoes para usar organization_id do perfil diretamente
-- em vez de get_current_org_id() que pode retornar NULL

DROP POLICY IF EXISTS "Users can view reclamacoes from their organization" ON public.reclamacoes;
DROP POLICY IF EXISTS "Users can insert reclamacoes in their organization" ON public.reclamacoes;
DROP POLICY IF EXISTS "Users can update reclamacoes in their organization" ON public.reclamacoes;
DROP POLICY IF EXISTS "Users can delete reclamacoes from their organization" ON public.reclamacoes;

-- SELECT policy
CREATE POLICY "Users can view reclamacoes from their organization"
ON public.reclamacoes
FOR SELECT
USING (
  organization_id IN (
    SELECT organizacao_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- INSERT policy
CREATE POLICY "Users can insert reclamacoes in their organization"
ON public.reclamacoes
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organizacao_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- UPDATE policy
CREATE POLICY "Users can update reclamacoes in their organization"
ON public.reclamacoes
FOR UPDATE
USING (
  organization_id IN (
    SELECT organizacao_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- DELETE policy
CREATE POLICY "Users can delete reclamacoes from their organization"
ON public.reclamacoes
FOR DELETE
USING (
  organization_id IN (
    SELECT organizacao_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Corrigir reclamacoes_mensagens
DROP POLICY IF EXISTS "Users can view messages from their org reclamacoes" ON public.reclamacoes_mensagens;
DROP POLICY IF EXISTS "Users can insert messages for their org reclamacoes" ON public.reclamacoes_mensagens;
DROP POLICY IF EXISTS "Users can update messages from their org reclamacoes" ON public.reclamacoes_mensagens;
DROP POLICY IF EXISTS "Users can delete messages from their org reclamacoes" ON public.reclamacoes_mensagens;

CREATE POLICY "Users can view messages from their org reclamacoes"
ON public.reclamacoes_mensagens
FOR SELECT
USING (
  claim_id IN (
    SELECT id FROM public.reclamacoes 
    WHERE organization_id IN (
      SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert messages for their org reclamacoes"
ON public.reclamacoes_mensagens
FOR INSERT
WITH CHECK (
  claim_id IN (
    SELECT id FROM public.reclamacoes 
    WHERE organization_id IN (
      SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update messages from their org reclamacoes"
ON public.reclamacoes_mensagens
FOR UPDATE
USING (
  claim_id IN (
    SELECT id FROM public.reclamacoes 
    WHERE organization_id IN (
      SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete messages from their org reclamacoes"
ON public.reclamacoes_mensagens
FOR DELETE
USING (
  claim_id IN (
    SELECT id FROM public.reclamacoes 
    WHERE organization_id IN (
      SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Corrigir reclamacoes_evidencias
DROP POLICY IF EXISTS "Users can view evidences from their org reclamacoes" ON public.reclamacoes_evidencias;
DROP POLICY IF EXISTS "Users can insert evidences for their org reclamacoes" ON public.reclamacoes_evidencias;
DROP POLICY IF EXISTS "Users can update evidences from their org reclamacoes" ON public.reclamacoes_evidencias;
DROP POLICY IF EXISTS "Users can delete evidences from their org reclamacoes" ON public.reclamacoes_evidencias;

CREATE POLICY "Users can view evidences from their org reclamacoes"
ON public.reclamacoes_evidencias
FOR SELECT
USING (
  claim_id IN (
    SELECT id FROM public.reclamacoes 
    WHERE organization_id IN (
      SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert evidences for their org reclamacoes"
ON public.reclamacoes_evidencias
FOR INSERT
WITH CHECK (
  claim_id IN (
    SELECT id FROM public.reclamacoes 
    WHERE organization_id IN (
      SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update evidences from their org reclamacoes"
ON public.reclamacoes_evidencias
FOR UPDATE
USING (
  claim_id IN (
    SELECT id FROM public.reclamacoes 
    WHERE organization_id IN (
      SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete evidences from their org reclamacoes"
ON public.reclamacoes_evidencias
FOR DELETE
USING (
  claim_id IN (
    SELECT id FROM public.reclamacoes 
    WHERE organization_id IN (
      SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);