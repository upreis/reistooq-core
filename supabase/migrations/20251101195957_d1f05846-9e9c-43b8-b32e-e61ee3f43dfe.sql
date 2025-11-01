-- Alterar constraint de foreign key para permitir exclusão de produtos
-- vinculados a pedidos de compra (mantém o registro do item mas remove a referência)

ALTER TABLE pedidos_compra_itens 
DROP CONSTRAINT IF EXISTS pedidos_compra_itens_produto_id_fkey;

ALTER TABLE pedidos_compra_itens 
ADD CONSTRAINT pedidos_compra_itens_produto_id_fkey 
FOREIGN KEY (produto_id) 
REFERENCES produtos(id) 
ON DELETE SET NULL;