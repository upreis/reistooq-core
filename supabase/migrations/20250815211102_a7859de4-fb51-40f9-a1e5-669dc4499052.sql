-- Add missing columns for complete compatibility with the image structure
ALTER TABLE public.historico_vendas 
ADD COLUMN IF NOT EXISTS integration_account_id UUID REFERENCES public.integration_accounts(id);

-- Add some sample data that matches the image structure
INSERT INTO public.historico_vendas (
  id_unico, numero_pedido, data_pedido, sku_produto, descricao, quantidade, 
  valor_unitario, valor_total, uf, cidade, situacao, numero_venda, 
  sku_estoque, sku_kit, qtd_kit, total_itens, status, cliente_nome, 
  cliente_documento, integration_account_id
) VALUES
  ('FL-85-MAR-1-SV', '#2790', '2025-07-08', 'FL-85-MAR-1', 'Flanela 85g Azul Marinho', 4, 15.99, 63.96, 'RJ', 'Rio de Janeiro', 'Entregue', '258789KDM41N4', 'FL-85-MAR-1', NULL, 0, 4, 'Pronto p/ baixar', 'João Silva Santos', '123.456.789-01', (SELECT id FROM public.integration_accounts LIMIT 1)),
  ('CMD-779-BEGE-1-SV', '#2813', '2025-07-08', 'CMD-779-BEGE-1', 'Camiseta 77% Poliester Bege', 2, 19.99, 39.98, 'AM', 'Manaus', 'Entregue', '258789M6BV56Q', 'CMD-779-BEGE-1', 'CMD-779-BEGE-1', 1, 2, 'Sem estoque', 'Maria Santos Silva', '987.654.321-02', (SELECT id FROM public.integration_accounts LIMIT 1)),
  ('CMD-991-BRAN-1-SV', '#2793', '2025-07-08', 'CMD-991-BRAN-1', 'Camiseta 99% Algodão Branca', 1, 34.00, 34.00, 'SP', 'São Paulo', 'Entregue', '258789KJM6N5B', 'CMD-991-BRAN-1', 'CMD-991-BRAN-1', 1, 1, 'Sem estoque', 'Pedro Costa Lima', '456.789.123-03', (SELECT id FROM public.integration_accounts LIMIT 1)),
  ('CMD-413-SORT-3-SV', '#2810', '2025-07-08', 'CMD-413-SORT-3', 'Camiseta 41% Poliester Sortida', 1, 24.39, 24.39, 'SP', 'Campinas', 'Entregue', '258789N3X917A3', 'CMD-413-SORT-3', 'CMD-413-SORT-1', 3, 3, 'Sem estoque', 'Ana Oliveira Costa', '789.123.456-04', (SELECT id FROM public.integration_accounts LIMIT 1)),
  ('FL-85-MAR-1-SV2', '#2788', '2025-07-08', 'FL-85-MAR-1', 'Flanela 85g Azul Marinho', 2, 15.99, 31.98, 'SP', 'Santos', 'Entregue', '258783JHNABRF', 'FL-85-MAR-1', NULL, 0, 2, 'Pronto p/ baixar', 'Carlos Ferreira Lima', '321.654.987-05', (SELECT id FROM public.integration_accounts LIMIT 1)),
  ('FL-83-RUIV-1-SV', '#2818', '2025-07-08', 'FL-83-RUIV-1', 'Flanela 83% Algodão Ruiva', 1, 18.90, 18.90, 'RJ', 'Niterói', 'Entregue', '258789NKEB3FG', 'FL-83-RUIV-1', 'FL-83-RUIV-1', 1, 1, 'Pronto p/ baixar', 'Beatriz Alves Santos', '159.753.486-06', (SELECT id FROM public.integration_accounts LIMIT 1)),
  ('FL-24-AZES-1-SV', '#2799', '2025-07-08', 'FL-24-AZES-1', 'Flanela 24% Poliester Azul Esverdeado', 1, 14.81, 14.81, 'SP', 'Sorocaba', 'Entregue', '258789KTTXMT05', 'FL-24-AZES-1', 'FL-24-AZES-1', 1, 1, 'Sem estoque', 'Rodrigo Silva Costa', '258.147.369-07', (SELECT id FROM public.integration_accounts LIMIT 1)),
  ('FL-24-R0X0-1-SV', '#2799', '2025-07-08', 'FL-24-R0X0-1', 'Flanela 24% Algodão Roxa', 1, 14.81, 14.81, 'SP', 'Campinas', 'Entregue', '258789KTTXMT05', 'FL-24-R0X0-1', 'FL-24-R0X0-1', 1, 1, 'Sem estoque', 'Patricia Lima Santos', '147.258.369-08', (SELECT id FROM public.integration_accounts LIMIT 1)),
  ('CMD-484-SORT-2-SV', '#2791', '2025-07-08', 'CMD-484-SORT-2', 'Camiseta 48% Algodão Sortida', 1, 15.99, 15.99, 'ES', 'Vitória', 'Entregue', '258789KN9A1BCH', 'CMD-484-SORT-2', 'CMD-484-SORT-1', 2, 2, 'Pronto p/ baixar', 'Eduardo Santos Silva', '369.258.147-09', (SELECT id FROM public.integration_accounts LIMIT 1)),
  ('CMD-29-VERD-1-SV', '#2801', '2025-07-08', 'CMD-29-VERD-1', 'Camiseta 29% Poliester Verde', 1, 28.90, 28.90, 'SP', 'Ribeirão Preto', 'Entregue', '258789KMENSHSE', 'CMD-29-VERD-1', 'CMD-29-VERD-1', 1, 1, 'Sem estoque', 'Fernanda Costa Lima', '951.357.486-10', (SELECT id FROM public.integration_accounts LIMIT 1)),
  ('CMD-29-VERD-1-SV2', '#2836', '2025-07-08', 'CMD-29-VERD-1', 'Camiseta 29% Poliester Verde', 1, 28.90, 28.90, 'SP', 'São José dos Campos', 'Entregue', '258789WNDDN1', 'CMD-29-VERD-1', 'CMD-29-VERD-1', 1, 1, 'Sem estoque', 'Gabriel Alves Santos', '753.159.842-11', (SELECT id FROM public.integration_accounts LIMIT 1))
ON CONFLICT (id_unico) DO NOTHING;