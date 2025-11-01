/**
 * 💰 FORMATADORES DE VALORES PARA ESTOQUE
 * Funções utilitárias para formatação de preços, datas e valores
 */

export const formatPrice = (price: number | null): string => {
  if (!price || price === 0) return "R$ 0,00";
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatNumber = (value: number | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined) return "-";
  return value.toFixed(decimals);
};

export const formatDimensions = (
  largura?: number, 
  altura?: number, 
  comprimento?: number
): string => {
  if (largura && altura && comprimento) {
    return `${largura}x${altura}x${comprimento}`;
  }
  return "-";
};
