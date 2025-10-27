-- ✅ Adicionar novos campos de resolution que existem na API ML
ALTER TABLE reclamacoes
ADD COLUMN IF NOT EXISTS resolution_closed_by TEXT,
ADD COLUMN IF NOT EXISTS resolution_applied_coverage BOOLEAN DEFAULT false;

-- 🔧 Corrigir dados existentes usando raw_data

-- 1. Corrigir resolution_date (usar date_created do raw_data)
UPDATE reclamacoes
SET resolution_date = (raw_data->'resolution'->>'date_created')::timestamp with time zone
WHERE raw_data->'resolution'->'date_created' IS NOT NULL
AND resolution_date IS NULL;

-- 2. Corrigir resolution_benefited (pegar primeiro elemento do array)
UPDATE reclamacoes
SET resolution_benefited = raw_data->'resolution'->'benefited'->>0
WHERE raw_data->'resolution'->'benefited' IS NOT NULL;

-- 3. Adicionar resolution_closed_by
UPDATE reclamacoes
SET resolution_closed_by = raw_data->'resolution'->>'closed_by'
WHERE raw_data->'resolution'->'closed_by' IS NOT NULL;

-- 4. Adicionar resolution_applied_coverage
UPDATE reclamacoes
SET resolution_applied_coverage = (raw_data->'resolution'->>'applied_coverage')::boolean
WHERE raw_data->'resolution'->'applied_coverage' IS NOT NULL;