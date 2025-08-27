// src/utils/snapshot.ts
import { supabase } from '@/integrations/supabase/client';

const toNum = (x: any) => {
  if (x == null) return null;
  const s = typeof x === 'string' ? x.replace(/\./g,'').replace(',','.') : x;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

// mapeia o objeto da linha de /pedidos para snapshot
export function pedidoToSnapshot(p: any) {
  return {
    id_unico: String(p.id ?? p.numero ?? p.numero_pedido ?? ''),
    numero_pedido: String(p.numero ?? p.numero_pedido ?? p.id ?? ''),
    empresa: p.empresa ?? 'MercadoLivre',
    nome_cliente: p.nome_cliente ?? null,
    situacao: p.situacao ?? p.status ?? null,
    data_pedido: (p.data_pedido ?? p.created_at ?? '').slice(0,10) || null,

    valor_total: toNum(p.valor_total ?? p.total),
    valor_frete: toNum(p.valor_frete),
    valor_desconto: toNum(p.valor_desconto ?? p.discount),

    cidade: p.cidade ?? p.shipping?.receiver_address?.city ?? null,
    uf: p.uf ?? p.shipping?.receiver_address?.state ?? null,
    codigo_rastreamento: p.codigo_rastreamento ?? p.shipping?.tracking_number ?? null,

    raw: p, // guarda tudo
  };
}

// salva direto na tabela com RLS por created_by
export async function salvarSnapshotBaixa(pedido: any) {
  const { data: s } = await supabase.auth.getSession();
  const created_by = s?.session?.user?.id;
  if (!created_by) throw new Error('Usuário não autenticado');

  console.log('[linha-pedido]', pedido);

  const snapshot = pedidoToSnapshot(pedido);
  const row = { 
    ...snapshot,
    created_by,
    origem: 'baixa_estoque',
    // Garantir que data_pedido não seja null
    data_pedido: snapshot.data_pedido || new Date().toISOString().slice(0,10)
  };

  console.log('[dados-para-salvar]', row);

  const { data, error } = await supabase
    .from('historico_vendas')
    .upsert(row as any, { onConflict: 'id_unico,origem' }) // idempotente
    .select()
    .single();

  if (error) {
    console.error('[erro-snapshot]', error);
    throw error;
  }
  
  console.log('[snapshot-salvo]', data);
  return data;
}