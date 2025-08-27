// src/utils/snapshot.ts
import { supabase } from '@/integrations/supabase/client';

// FLUXO SIMPLIFICADO: Baixa de estoque direto no historico_vendas
export async function salvarSnapshotBaixa(pedido: any) {
  const { data: session } = await supabase.auth.getSession();
  const created_by = session?.session?.user?.id;
  if (!created_by) throw new Error('Usuário não autenticado');

  console.log('[baixa-estoque-inicio]', pedido);

  // Extrair apenas os dados essenciais
  const numeroPedido = String(pedido.numero ?? pedido.numero_pedido ?? pedido.id ?? '');
  const idUnico = `baixa_${numeroPedido}_${Date.now()}`;
  
  // Valores básicos com fallbacks seguros
  const valorTotal = Number(pedido.valor_total ?? pedido.total ?? 0) || 0;
  const nomeCliente = pedido.nome_cliente || pedido.buyer?.nickname || 'Cliente não identificado';
  const dataHoje = new Date().toISOString().slice(0, 10);

  // Dados mínimos necessários para inserção
  const dadosBaixa = {
    id_unico: idUnico,
    numero_pedido: numeroPedido,
    sku_produto: 'BAIXA_ESTOQUE',
    descricao: `Baixa de estoque - Pedido ${numeroPedido}`,
    quantidade: 1,
    valor_unitario: valorTotal,
    valor_total: valorTotal,
    cliente_nome: nomeCliente,
    status: 'baixado',
    data_pedido: dataHoje,
    created_by,
    origem: 'baixa_estoque',
    empresa: pedido.empresa || 'Sistema',
    raw: pedido // Guardar dados originais para auditoria
  };

  console.log('[dados-inserção]', dadosBaixa);

  try {
    const { data, error } = await supabase
      .from('historico_vendas')
      .insert(dadosBaixa)
      .select()
      .single();

    if (error) {
      console.error('[erro-inserção]', error);
      throw error;
    }

    console.log('[sucesso-inserção]', data);
    return data;
  } catch (error) {
    console.error('[erro-baixa-estoque]', error);
    throw error;
  }
}