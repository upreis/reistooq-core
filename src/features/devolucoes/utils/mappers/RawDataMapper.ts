/**
 * 📦 MAPEADOR DE DADOS BRUTOS
 * Mantém dados originais da API
 */

export const mapRawData = (item: any) => {
  return {
    dados_order: item.order_data || {},
    dados_claim: item.claim_details || {},
    dados_mensagens: item.claim_messages || {},
    dados_return: item.return_details_v2 || item.return_details_v1 || {}
  };
};
