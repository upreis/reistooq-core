/**
 * 🎯 MAPEADOR DE DADOS BÁSICOS
 * Consolida: principais, produto, classificação
 */

export const mapBasicData = (item: any, accountId: string, accountName: string, reasonId: string | null) => {
  // ✅ CÁLCULOS DE CLASSIFICAÇÃO
  const reasonIdStr = reasonId || item.claim_details?.reason_id;
  
  const categoriaProblema = (() => {
    if (!reasonIdStr) return null;
    if (['DEFECTIVE', 'BROKEN', 'DAMAGED_SHIPPING', 'PDD'].some(r => reasonIdStr.includes(r))) {
      return 'Qualidade do Produto';
    }
    if (['NOT_AS_DESCRIBED', 'WRONG_ITEM', 'DIFFERENT'].some(r => reasonIdStr.includes(r))) {
      return 'Descrição Incorreta';
    }
    if (['MISSING_PARTS', 'INCOMPLETE'].some(r => reasonIdStr.includes(r))) {
      return 'Produto Incompleto';
    }
    if (['PNR', 'NOT_RECEIVED'].some(r => reasonIdStr.includes(r))) {
      return 'Não Recebido';
    }
    if (['CS', 'CANCEL'].some(r => reasonIdStr.includes(r))) {
      return 'Cancelamento';
    }
    return 'Outros';
  })();
  
  const nivelComplexidade = (() => {
    let pontos = 0;
    if (item.mediation_details || item.claim_details?.type === 'mediations') pontos += 3;
    if ((item.claim_messages?.messages?.length || 0) > 10) pontos += 2;
    if ((item.claim_attachments?.length || 0) > 5) pontos += 1;
    if (item.return_details_v2 || item.return_details_v1) pontos += 1;
    if ((item.order_data?.total_amount || 0) > 500) pontos += 2;
    if (item.change_details) pontos += 1;
    
    if (pontos >= 6) return 'Alto';
    if (pontos >= 3) return 'Médio';
    return 'Baixo';
  })();
  
  return {
    // Dados principais
    order_id: item.order_id?.toString() || '',
    claim_id: item.claim_details?.id?.toString() || null,
    integration_account_id: accountId,
    data_criacao: item.date_created || null,
    status_devolucao: item.status || 'cancelled',
    account_name: accountName,
    marketplace_origem: 'ML_BRASIL',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ultima_sincronizacao: new Date().toISOString(),
    dados_incompletos: false,
    campos_faltantes: [],
    fonte_dados_primaria: 'ml_api',
    
    // Dados do produto
    produto_titulo: item.resource_data?.title || item.reason || 'Produto não identificado',
    sku: item.resource_data?.sku || item.order_data?.order_items?.[0]?.item?.seller_sku || '',
    quantidade: parseInt(item.resource_data?.quantity || item.order_data?.order_items?.[0]?.quantity || 1),
    valor_retido: parseFloat(item.amount || 0),
    valor_original_produto: item.order_data?.order_items?.[0]?.unit_price || null,
    
    // Classificação (COM CÁLCULOS)
    tipo_claim: item.type || item.claim_details?.type,
    subtipo_claim: item.claim_details?.stage || null,
    motivo_categoria: reasonIdStr,
    categoria_problema: categoriaProblema,
    subcategoria_problema: item.claim_details?.reason?.description || null,
    metodo_resolucao: item.claim_details?.resolution?.reason || null,
    resultado_final: item.claim_details?.status || null,
    nivel_prioridade: item.claim_details?.type === 'mediations' ? 'high' : 'medium',
    nivel_complexidade: nivelComplexidade,
    acao_seller_necessaria: (item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.length || 0) > 0,
    proxima_acao_requerida: null,
    impacto_reputacao: 'low',
    satisfacao_comprador: null,
    feedback_comprador_final: null,
    feedback_vendedor: null,
    taxa_satisfacao: null,
    score_satisfacao_final: null
  };
};
