-- Inserir conhecimento base da página De-Para para o chatbot AI
-- Usando organization_id NULL para ser global (ou ajustar para específico)

INSERT INTO knowledge_base (
  id,
  organization_id,
  source,
  title,
  content,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  NULL,
  'manual',
  'Página De-Para - Mapeamento de SKUs',
  'Essa página de De/Para serve para mapear o SKU do pedido com o SKU do estoque e assim dar saída corretamente do estoque.

Por exemplo, se no pedido estiver SKU:123 e no estoque tiver algum produto com o SKU:123, ele irá dar a saída corretamente. Mas caso em algum cadastro erre o SKU e coloque 124, esse SKU cairá no de/para e aguardará seu preenchimento na coluna SKU Correto.

Depois de cadastrado, os pedidos que ainda não saíram do estoque por erro de cadastro de SKU poderão ser baixados do estoque normalmente.

E as próximas vendas, se quiser corrigir o SKU para 123 no marketplace, pode corrigir, pois ele já está mapeado que o SKU Pedido 124 é igual ao SKU Correto 123.

A página mostra uma lista de todos os mapeamentos, com as colunas SKU Pedido (o SKU que veio errado do marketplace), SKU Correto (o SKU real do seu estoque), Nome do Produto, Status (ativo ou inativo) e data de criação.

Você pode adicionar novos mapeamentos clicando no botão de adicionar, editar mapeamentos existentes ou desativar mapeamentos que não são mais necessários.',
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;