/**
 * 📦 MAPEADOR DE DADOS BRUTOS
 * Mantém dados originais da API
 */

export const mapRawData = (item: any) => {
  return {
    dados_order: item.order_data || {},
    // ✅ CORREÇÃO: dados_claim deve ter o claim inteiro para ter acesso a resolution
    dados_claim: {
      ...item,
      // Remove propriedades que já estão em outras colunas para evitar duplicação
      order_data: undefined,
      claim_messages: undefined
    },
    dados_mensagens: item.claim_messages || {},
    dados_return: item.return_details_v2 || item.return_details_v1 || {}
  };
};
