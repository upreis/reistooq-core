-- Conceder privilégios básicos à role authenticated na tabela historico_vendas
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.historico_vendas TO authenticated;
-- Opcional: permitir SELECT para anon se necessário (não habilitando INSERT)
-- GRANT SELECT ON TABLE public.historico_vendas TO anon;