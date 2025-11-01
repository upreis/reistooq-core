import { Product } from "@/hooks/useProducts";

export interface ParentProductCalculations {
  quantidade_atual: number; // soma
  preco_custo: number; // média
  preco_venda: number; // média
  estoque_minimo: number; // média
  estoque_maximo: number; // média
  url_imagem: string | null; // primeiro filho
  hasChildren: boolean;
  childrenCount: number;
}

/**
 * Calcula os valores de um produto PAI baseado nos seus produtos filho
 */
export function calculateParentProductData(
  parentSku: string,
  allProducts: Product[]
): ParentProductCalculations {
  // Encontrar todos os filhos deste pai
  const children = allProducts.filter(p => p.sku_pai === parentSku);
  
  if (children.length === 0) {
    return {
      quantidade_atual: 0,
      preco_custo: 0,
      preco_venda: 0,
      estoque_minimo: 0,
      estoque_maximo: 0,
      url_imagem: null,
      hasChildren: false,
      childrenCount: 0,
    };
  }

  // Calcular soma da quantidade
  const quantidade_atual = children.reduce((sum, child) => sum + (child.quantidade_atual || 0), 0);

  // Calcular médias
  const preco_custo = children.reduce((sum, child) => sum + (child.preco_custo || 0), 0) / children.length;
  const preco_venda = children.reduce((sum, child) => sum + (child.preco_venda || 0), 0) / children.length;
  const estoque_minimo = children.reduce((sum, child) => sum + (child.estoque_minimo || 0), 0) / children.length;
  const estoque_maximo = children.reduce((sum, child) => sum + (child.estoque_maximo || 0), 0) / children.length;

  // Pegar imagem do primeiro filho
  const url_imagem = children.find(c => c.url_imagem)?.url_imagem || null;

  return {
    quantidade_atual: Math.round(quantidade_atual),
    preco_custo: Math.round(preco_custo * 100) / 100,
    preco_venda: Math.round(preco_venda * 100) / 100,
    estoque_minimo: Math.round(estoque_minimo * 100) / 100,
    estoque_maximo: Math.round(estoque_maximo * 100) / 100,
    url_imagem,
    hasChildren: true,
    childrenCount: children.length,
  };
}

/**
 * Verifica se um produto é PAI (tem filhos)
 */
export function isParentProduct(product: Product, allProducts: Product[]): boolean {
  return product.eh_produto_pai === true || 
         allProducts.some(p => p.sku_pai === product.sku_interno);
}
