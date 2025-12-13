-- Corrigir search_path da função para segurança
CREATE OR REPLACE FUNCTION create_default_stock_location()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.locais_estoque (organization_id, nome, tipo, descricao, is_system, ativo)
  VALUES (NEW.id, 'Estoque Principal', 'principal', 'Local de estoque principal da organização', true, true)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;