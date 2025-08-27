-- Adicionar colunas de endereço na tabela historico_vendas
-- para capturar os dados completos da fotografia dos pedidos

ALTER TABLE public.historico_vendas 
ADD COLUMN IF NOT EXISTS rua text,
ADD COLUMN IF NOT EXISTS numero text,
ADD COLUMN IF NOT EXISTS bairro text,
ADD COLUMN IF NOT EXISTS cep text;

-- Comentários para documentar as novas colunas
COMMENT ON COLUMN public.historico_vendas.rua IS 'Endereço - nome da rua do destinatário';
COMMENT ON COLUMN public.historico_vendas.numero IS 'Endereço - número da casa/estabelecimento';
COMMENT ON COLUMN public.historico_vendas.bairro IS 'Endereço - bairro do destinatário';
COMMENT ON COLUMN public.historico_vendas.cep IS 'Endereço - CEP do destinatário';