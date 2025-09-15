-- Ativar realtime para a tabela devolucoes_avancadas
-- Isso permite atualizações em tempo real na interface

-- 1. Configurar replica identity para capturar dados completos durante updates
ALTER TABLE public.devolucoes_avancadas REPLICA IDENTITY FULL;

-- 2. Adicionar a tabela à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.devolucoes_avancadas;