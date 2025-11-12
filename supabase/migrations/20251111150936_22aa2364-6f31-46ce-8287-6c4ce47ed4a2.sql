-- ✅ LIMPAR DUPLICATAS E CRIAR CONSTRAINT ÚNICA

-- 1. Deletar registros duplicados, mantendo apenas o mais recente por claim_id
DELETE FROM public.devolucoes_avancadas
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY claim_id ORDER BY created_at DESC NULLS LAST, id DESC) as rn
    FROM public.devolucoes_avancadas
    WHERE claim_id IS NOT NULL
  ) t
  WHERE rn > 1
);

-- 2. Criar constraint única para claim_id
ALTER TABLE public.devolucoes_avancadas 
ADD CONSTRAINT devolucoes_avancadas_claim_id_key 
UNIQUE (claim_id);

-- 3. Criar índice para claim_id
CREATE INDEX IF NOT EXISTS idx_devolucoes_claim_id 
ON public.devolucoes_avancadas (claim_id);

COMMENT ON CONSTRAINT devolucoes_avancadas_claim_id_key 
ON public.devolucoes_avancadas 
IS 'Constraint única para claim_id, permitindo upsert de claims sem dependência de order_id';