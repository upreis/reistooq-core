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
  // Extrair valor_total de múltiplas fontes
  let valorTotal = toNum(p.valor_total ?? p.total);
  
  // Se não encontrou, tentar extrair do payments (Mercado Livre)
  if (!valorTotal && p.payments && Array.isArray(p.payments)) {
    valorTotal = p.payments.reduce((sum: number, payment: any) => {
      return sum + (toNum(payment.transaction_amount ?? payment.total_paid_amount) ?? 0);
    }, 0);
  }
  
  // Se ainda não encontrou, tentar raw.payments
  if (!valorTotal && p.raw?.payments && Array.isArray(p.raw.payments)) {
    valorTotal = p.raw.payments.reduce((sum: number, payment: any) => {
      return sum + (toNum(payment.transaction_amount ?? payment.total_paid_amount) ?? 0);
    }, 0);
  }

  return {
    id_unico: String(p.id ?? p.numero ?? p.numero_pedido ?? ''),
    numero_pedido: String(p.numero ?? p.numero_pedido ?? p.id ?? ''),
    empresa: p.empresa ?? 'MercadoLivre',
    nome_cliente: p.nome_cliente ?? p.buyer?.nickname ?? null,
    situacao: p.situacao ?? p.status ?? null,
    data_pedido: (p.data_pedido ?? p.created_at ?? p.date_created ?? '').slice(0,10) || null,

    valor_total: valorTotal,
    valor_frete: toNum(p.valor_frete ?? p.shipping?.cost),
    valor_desconto: toNum(p.valor_desconto ?? p.discount),

    cidade: p.cidade ?? p.shipping?.receiver_address?.city ?? p.shipping?.destination?.shipping_address?.city ?? null,
    uf: p.uf ?? p.shipping?.receiver_address?.state ?? p.shipping?.destination?.shipping_address?.state?.id ?? null,
    codigo_rastreamento: p.codigo_rastreamento ?? p.shipping?.tracking_number ?? null,

    raw: p, // guarda tudo
  };
}

// salva direto na tabela com RLS por created_by
export async function salvarSnapshotBaixa(pedido: any) {
  const { data: s } = await supabase.auth.getSession();
  const created_by = s?.session?.user?.id;
  if (!created_by) throw new Error('Usuário não autenticado');

  // Logar a linha recebida da página de pedidos
  console.log('[linha-pedido]', pedido);

  // Normalizar campos básicos
  const snap = pedidoToSnapshot(pedido);
  const valorTotal = toNum(pedido.valor_total ?? pedido.total) ?? 0;
  const valorUnit = toNum(pedido.valor_unitario) ?? valorTotal;
  const numeroPedido = String(pedido.numero ?? pedido.numero_pedido ?? pedido.id ?? snap.id_unico ?? '');
  const dataPedido = (snap.data_pedido || new Date().toISOString().slice(0,10));

  // Montar linha respeitando NOT NULLs da tabela existente
  const row = {
    ...snap,
    created_by,
    origem: 'baixa_estoque',
    numero_pedido: numeroPedido,
    status: 'baixado',
    sku_produto: 'BAIXA_ESTOQUE',
    quantidade: 1,
    valor_unitario: valorUnit,
    valor_total: valorTotal,
    data_pedido: dataPedido
  } as any;

  console.log('[dados-para-salvar]', row);

  const { data, error } = await supabase
    .from('historico_vendas')
    .upsert(row, { onConflict: 'id_unico,origem' }) // idempotente
    .select()
    .single();

  if (error) {
    console.error('[erro-snapshot]', error);
    throw error;
  }

  console.log('[snapshot-salvo]', data);
  return data;
}