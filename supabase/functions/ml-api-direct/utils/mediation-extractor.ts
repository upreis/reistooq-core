/**
 * 🔧 MEDIATION EXTRACTOR UTILITY
 * Centraliza extração de dados de mediação e feedbacks
 */

/**
 * Extrai dados de mediação e feedbacks do comprador/vendedor
 */
export function extractMediationData(
  claimMessages: any,
  buyer: any,
  seller: any
) {
  return {
    feedback_comprador_final: extractBuyerFinalFeedback(claimMessages, buyer),
    feedback_vendedor: extractSellerFeedback(claimMessages, seller)
  };
}

/**
 * Extrai último feedback do comprador
 */
function extractBuyerFinalFeedback(claimMessages: any, buyer: any): string | null {
  try {
    const mensagens = claimMessages?.messages || [];
    const compradorId = buyer?.id;
    
    if (!compradorId || mensagens.length === 0) return null;
    
    // Buscar TODAS as mensagens do comprador
    const buyerMessages = mensagens.filter((m: any) =>
      m.from?.user_id === compradorId || m.from === 'buyer'
    );
    
    if (buyerMessages.length === 0) return null;
    
    // Ordenar por data e pegar a última
    const ordenadas = [...buyerMessages].sort((a: any, b: any) => {
      const dateA = new Date(a.date_created).getTime();
      const dateB = new Date(b.date_created).getTime();
      return dateB - dateA; // Ordem decrescente (mais recente primeiro)
    });
    
    const ultimaMensagem = ordenadas[0]?.text || ordenadas[0]?.message;
    
    return ultimaMensagem || null;
  } catch (error) {
    console.error('❌ Erro ao extrair feedback_comprador_final:', error);
    return null;
  }
}

/**
 * Extrai último feedback do vendedor
 */
function extractSellerFeedback(claimMessages: any, seller: any): string | null {
  try {
    const mensagens = claimMessages?.messages || [];
    const vendedorId = seller?.id;
    
    if (!vendedorId || mensagens.length === 0) return null;
    
    // Buscar TODAS as mensagens do vendedor
    const sellerMessages = mensagens.filter((m: any) =>
      m.from?.user_id === vendedorId || m.from === 'seller'
    );
    
    if (sellerMessages.length === 0) return null;
    
    // Ordenar por data e pegar a última
    const ordenadas = [...sellerMessages].sort((a: any, b: any) => {
      const dateA = new Date(a.date_created).getTime();
      const dateB = new Date(b.date_created).getTime();
      return dateB - dateA; // Ordem decrescente
    });
    
    const ultimaMensagem = ordenadas[0]?.text || ordenadas[0]?.message;
    
    return ultimaMensagem || null;
  } catch (error) {
    console.error('❌ Erro ao extrair feedback_vendedor:', error);
    return null;
  }
}
