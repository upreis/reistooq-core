-- Atualizar impacto financeiro para registros que estão NULL
-- Baseado na mesma lógica da edge function

UPDATE reclamacoes
SET 
  impacto_financeiro = CASE
    -- Claims ainda abertos = neutro
    WHEN status = 'opened' THEN 'neutro'
    
    -- Claims cobertos pelo ML (applied_coverage = true e benefited = complainant)
    WHEN resolution_applied_coverage = true AND resolution_benefited = 'complainant' THEN 'coberto_ml'
    
    -- Vendedor ganhou (benefited = respondent)
    WHEN resolution_benefited = 'respondent' THEN 'ganho'
    
    -- Comprador ganhou e não foi coberto pelo ML (benefited = complainant e applied_coverage = false)
    WHEN resolution_benefited = 'complainant' AND (resolution_applied_coverage = false OR resolution_applied_coverage IS NULL) THEN 'perda'
    
    -- Casos fechados sem resolução clara
    WHEN status = 'closed' AND resolution_benefited IS NULL THEN 'neutro'
    
    -- Default
    ELSE 'neutro'
  END,
  
  valor_impacto = CASE
    -- Se for ganho, o valor é o amount_value (vendedor mantém o dinheiro)
    WHEN resolution_benefited = 'respondent' THEN COALESCE(amount_value, 0)
    
    -- Se for perda, o valor é negativo (vendedor perde o dinheiro)
    WHEN resolution_benefited = 'complainant' AND (resolution_applied_coverage = false OR resolution_applied_coverage IS NULL) THEN -COALESCE(amount_value, 0)
    
    -- Coberto pelo ML ou neutro = 0
    ELSE 0
  END
  
WHERE impacto_financeiro IS NULL;