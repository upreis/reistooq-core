// src/utils/snapshot.ts
import { supabase } from '@/integrations/supabase/client';
import { buildIdUnico } from './idUnico';

// FLUXO SIMPLIFICADO: Baixa de estoque direto no historico_vendas
export async function salvarSnapshotBaixa(pedido: any) {
  const { data: session } = await supabase.auth.getSession();
  const created_by = session?.session?.user?.id;
  if (!created_by) throw new Error('Usuário não autenticado');

  console.log('[baixa-estoque-inicio]', pedido);

  // Helper para valores nulos
  const orDefault = (value: any) => value ?? '-';

  // Timestamp atual
  const agora = new Date().toISOString();
  const dataAtual = new Date().toISOString().slice(0, 10);

  // Dados completos conforme especificação
  const dadosBaixa = {
    // SEÇÃO BÁSICAS
    id_unico: buildIdUnico(pedido),
    empresa: orDefault(pedido.empresa),
    numero_pedido: orDefault(pedido.numero || pedido.id),
    cliente_nome: orDefault(pedido.nome_cliente),
    nome_completo: orDefault(pedido.nome_cliente),
    data_pedido: pedido.data_pedido || dataAtual,
    ultima_atualizacao: agora,

    // SEÇÃO PRODUTOS
    sku_produto: orDefault(pedido.order_items?.[0]?.item?.seller_sku),
    quantidade_total: pedido.total_itens || 0,
    titulo_produto: orDefault(pedido.order_items?.[0]?.item?.title),

    // SEÇÃO FINANCEIRAS
    valor_total: Number(pedido.valor_total) || 0,
    valor_pago: Number(pedido.paid_amount) || 0,
    frete_pago_cliente: Number(pedido.payments?.[0]?.shipping_cost) || 0,
    receita_flex_bonus: 0,
    custo_envio_seller: 0,
    desconto_cupom: Number(pedido.coupon?.amount) || 0,
    taxa_marketplace: 0,
    valor_liquido_vendedor: Number(pedido.paid_amount) || 0,
    metodo_pagamento: orDefault(pedido.payments?.[0]?.payment_method_id),
    status_pagamento: orDefault(pedido.payments?.[0]?.status),
    tipo_pagamento: orDefault(pedido.payments?.[0]?.payment_type),

    // SEÇÃO MAPEAMENTO
    status_mapeamento: '',
    sku_estoque: orDefault(pedido.sku_estoque),
    sku_kit: orDefault(pedido.sku_kit),
    quantidade_kit: pedido.qtd_kit || 0,
    total_itens: pedido.total_itens || 0,
    status_baixa: orDefault(pedido.status_estoque),

    // SEÇÃO ENVIO
    status: 'baixado',
    status_envio: orDefault(pedido.status_detail),
    logistic_mode_principal: '',
    tipo_logistico: '',
    tipo_metodo_envio: '',
    tipo_entrega: '',
    substatus_estado_atual: orDefault(pedido.status_detail),
    modo_envio_combinado: '',
    metodo_envio_combinado: '',
    cidade: orDefault(pedido.cidade),
    uf: orDefault(pedido.uf),

    // Campos de controle
    created_by,
    origem: 'baixa_estoque',
    raw: pedido
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