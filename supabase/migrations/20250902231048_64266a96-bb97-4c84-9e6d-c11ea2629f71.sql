-- Atualizar e adicionar todas as categorias principais solicitadas
-- Primeiro, vamos desativar as categorias existentes para começar fresh
UPDATE categorias_produtos SET ativo = false WHERE nivel = 1;

-- Agora inserir todas as categorias principais na ordem especificada
INSERT INTO categorias_produtos (nome, nivel, ordem, cor, icone, ativo, organization_id) VALUES
('Acessórios para Veículos', 1, 1, '#ef4444', 'Car', true, (SELECT get_current_org_id())),
('Agro', 1, 2, '#16a34a', 'Wheat', true, (SELECT get_current_org_id())),
('Alimentos e Bebidas', 1, 3, '#f97316', 'Coffee', true, (SELECT get_current_org_id())),
('Animais', 1, 4, '#eab308', 'Dog', true, (SELECT get_current_org_id())),
('Antiguidades e Coleções', 1, 5, '#8b5cf6', 'Crown', true, (SELECT get_current_org_id())),
('Arte, Papelaria e Armarinho', 1, 6, '#06b6d4', 'Palette', true, (SELECT get_current_org_id())),
('Celulares e Telefones', 1, 7, '#3b82f6', 'Smartphone', true, (SELECT get_current_org_id())),
('Informática', 1, 8, '#6366f1', 'Laptop', true, (SELECT get_current_org_id())),
('Ferramentas', 1, 9, '#f59e0b', 'Wrench', true, (SELECT get_current_org_id())),
('Casa, Móveis e Decoração', 1, 10, '#10b981', 'Home', true, (SELECT get_current_org_id())),
('Bebês', 1, 11, '#ec4899', 'Baby', true, (SELECT get_current_org_id())),
('Beleza e Cuidado Pessoal', 1, 12, '#f43f5e', 'Sparkles', true, (SELECT get_current_org_id())),
('Brinquedos e Hobbies', 1, 13, '#14b8a6', 'Gamepad2', true, (SELECT get_current_org_id())),
('Calçados, Roupas e Bolsas', 1, 14, '#a855f7', 'Shirt', true, (SELECT get_current_org_id())),
('Eletrônicos, Áudio e Vídeo', 1, 15, '#2563eb', 'Monitor', true, (SELECT get_current_org_id())),
('Câmeras e Acessórios', 1, 16, '#7c3aed', 'Camera', true, (SELECT get_current_org_id())),
('Saúde', 1, 17, '#dc2626', 'Heart', true, (SELECT get_current_org_id())),
('Construção', 1, 18, '#059669', 'Hammer', true, (SELECT get_current_org_id())),
('Eletrodomésticos', 1, 19, '#0891b2', 'Microwave', true, (SELECT get_current_org_id())),
('Esportes e Fitness', 1, 20, '#ea580c', 'Dumbbell', true, (SELECT get_current_org_id())),
('Festas e Lembrancinhas', 1, 21, '#d946ef', 'PartyPopper', true, (SELECT get_current_org_id())),
('Games', 1, 22, '#8b5cf6', 'Gamepad', true, (SELECT get_current_org_id())),
('Indústria e Comércio', 1, 23, '#475569', 'Factory', true, (SELECT get_current_org_id())),
('Instrumentos Musicais', 1, 24, '#f59e0b', 'Music', true, (SELECT get_current_org_id())),
('Ingressos', 1, 25, '#06b6d4', 'Ticket', true, (SELECT get_current_org_id())),
('Joias e Relógios', 1, 26, '#fbbf24', 'Gem', true, (SELECT get_current_org_id())),
('Livros, Revistas e Comics', 1, 27, '#7c2d12', 'Book', true, (SELECT get_current_org_id())),
('Mais Categorias', 1, 28, '#6b7280', 'MoreHorizontal', true, (SELECT get_current_org_id())),
('Música, Filmes e Seriados', 1, 29, '#be123c', 'PlayCircle', true, (SELECT get_current_org_id()));