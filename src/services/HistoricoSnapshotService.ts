// src/services/HistoricoSnapshotService.ts
import { supabase } from '@/integrations/supabase/client';

export type PedidoLike = {
  id?: string | number;
  numero?: string | number;
  numero_ecommerce?: string | number;
  empresa?: string; origem?: string;
  situacao?: string; status?: string;
  nome_cliente?: string; cliente?: string;
  valor_total?: number | string; total?: number | string;
  itens?: any[];
  [k: string]: any;
};

function resolveNumero(p: PedidoLike) {
  return String(
    p.numero ?? p.id ?? p.numero_ecommerce ?? ''
  ) || null;
}

function toNum(v: any) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function criarSnapshot(pedido: PedidoLike) {
  const { data: au } = await supabase.auth.getUser();
  if (!au?.user) throw new Error('Usuário não autenticado');

  const row = {
    created_by: au.user.id,
    numero_pedido: resolveNumero(pedido),
    id_unico: resolveNumero(pedido),
    sku_produto: 'BAIXA_ESTOQUE',
    data_pedido: new Date().toISOString().split('T')[0],
    origem: pedido.empresa ?? pedido.origem ?? 'MercadoLivre',
    status: pedido.situacao ?? pedido.status ?? null,
    cliente_nome: pedido.nome_cliente ?? pedido.cliente ?? null,
    valor_total: toNum(pedido.valor_total ?? pedido.total),
    total_itens: Array.isArray(pedido.itens) ? pedido.itens.length : 0,
    raw: pedido,
  };

  const { data, error } = await supabase
    .from('historico_vendas')
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Manter a classe original para compatibilidade
export class HistoricoSnapshotService {
  static async criarSnapshot(pedido: PedidoLike) {
    return criarSnapshot(pedido);
  }
}