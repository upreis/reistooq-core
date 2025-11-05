import { supabase } from '@/integrations/supabase/client';

export interface LocalEstoque {
  id: string;
  nome: string;
  organization_id: string;
  ativo: boolean;
  created_at: string;
}

export interface MapeamentoLocalEstoque {
  id: string;
  organization_id: string;
  empresa: string;
  tipo_logistico: string;
  marketplace: string;
  local_estoque_id: string;
  ativo: boolean;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  locais_estoque?: {
    id: string;
    nome: string;
  };
}

/**
 * Buscar todos os locais de estoque da organização
 */
export async function listarLocaisEstoque(): Promise<LocalEstoque[]> {
  const { data, error } = await supabase
    .from('locais_estoque')
    .select('*')
    .eq('ativo', true)
    .order('nome');

  if (error) throw error;
  return data || [];
}

/**
 * Buscar todos os mapeamentos de locais
 */
export async function listarMapeamentosLocais(): Promise<MapeamentoLocalEstoque[]> {
  const { data, error } = await supabase
    .from('mapeamento_locais_estoque')
    .select(`
      *,
      locais_estoque (
        id,
        nome
      )
    `)
    .eq('ativo', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as MapeamentoLocalEstoque[];
}

/**
 * Criar um novo mapeamento
 */
export async function criarMapeamentoLocal(
  dados: {
    empresa: string;
    tipo_logistico: string;
    marketplace: string;
    local_estoque_id: string;
    ativo: boolean;
    observacoes?: string;
  }
): Promise<MapeamentoLocalEstoque> {
  const { data, error } = await supabase
    .from('mapeamento_locais_estoque')
    .insert(dados as any)
    .select(`
      *,
      locais_estoque (
        id,
        nome
      )
    `)
    .single();

  if (error) throw error;
  return data as any;
}

/**
 * Atualizar um mapeamento existente
 */
export async function atualizarMapeamentoLocal(
  id: string,
  dados: {
    empresa?: string;
    tipo_logistico?: string;
    marketplace?: string;
    local_estoque_id?: string;
    ativo?: boolean;
    observacoes?: string;
  }
): Promise<MapeamentoLocalEstoque> {
  const { data, error } = await supabase
    .from('mapeamento_locais_estoque')
    .update(dados)
    .eq('id', id)
    .select(`
      *,
      locais_estoque (
        id,
        nome
      )
    `)
    .single();

  if (error) throw error;
  return data as MapeamentoLocalEstoque;
}

/**
 * Deletar um mapeamento
 */
export async function deletarMapeamentoLocal(id: string): Promise<void> {
  const { error } = await supabase
    .from('mapeamento_locais_estoque')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Aplicar mapeamento automaticamente para um pedido
 */
export async function aplicarMapeamentoAutomatico(pedidoId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('aplicar_mapeamento_local_estoque', {
    p_pedido_id: pedidoId
  });

  if (error) {
    console.warn('Erro ao aplicar mapeamento automático:', error);
    return null;
  }

  return data;
}

/**
 * Detectar marketplace de um pedido
 */
export async function detectarMarketplacePedido(
  integrationAccountId: string | null,
  organizationId: string
): Promise<string> {
  if (!integrationAccountId) return 'Interno';

  const { data, error } = await supabase.rpc('detectar_marketplace_pedido', {
    p_integration_account_id: integrationAccountId,
    p_organization_id: organizationId
  });

  if (error) {
    console.warn('Erro ao detectar marketplace:', error);
    return 'Interno';
  }

  return data || 'Interno';
}

/**
 * Buscar nome do local de estoque por ID
 */
export async function buscarNomeLocalEstoque(localId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('locais_estoque')
    .select('nome')
    .eq('id', localId)
    .single();

  if (error) return null;
  return data?.nome || null;
}
