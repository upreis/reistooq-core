/**
 * 📦 MAPEADOR DE DADOS BRUTOS
 * Mantém dados originais da API
 */

export const mapRawData = (item: any) => {
  return {
    dados_order: item.order_data || {},
    // ✅ CORREÇÃO: claim_details tem todos os campos do claim incluindo resolution
    dados_claim: item.claim_details || item || {},
    dados_mensagens: item.claim_messages || {},
    dados_return: item.return_details_v2 || item.return_details_v1 || {}
  };
};
