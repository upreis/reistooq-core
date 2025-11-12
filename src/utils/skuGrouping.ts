import { Product } from "@/hooks/useProducts";
import { calculateParentProductData } from "./parentProductCalculations";

export interface SkuGroup {
  parentSku: string;
  parentProduct?: Product;
  children: Product[];
  totalStock: number;
  hasLowStock: boolean;
}

export function groupProductsBySku(products: Product[]): SkuGroup[] {
  const groups = new Map<string, SkuGroup>();
  
  // Separar produtos pai e filhos
  const parentProducts = products.filter(p => p.eh_produto_pai === true);
  const childProducts = products.filter(p => p.eh_produto_pai !== true && p.sku_pai);
  const independentProducts = products.filter(p => p.eh_produto_pai !== true && !p.sku_pai);
  
  // Criar grupos para produtos pai
  parentProducts.forEach(parent => {
    groups.set(parent.sku_interno, {
      parentSku: parent.sku_interno,
      parentProduct: parent,
      children: [],
      totalStock: parent.quantidade_atual,
      hasLowStock: false // Será calculado após adicionar os filhos
    });
  });
  
  // Adicionar filhos aos seus pais
  childProducts.forEach(child => {
    if (child.sku_pai) {
      const group = groups.get(child.sku_pai);
      if (group) {
        group.children.push(child);
        group.totalStock += child.quantidade_atual;
      } else {
        // Se o pai não existe, tratar como independente
        groups.set(child.sku_interno, {
          parentSku: child.sku_interno,
          parentProduct: child,
          children: [],
          totalStock: child.quantidade_atual,
          hasLowStock: child.quantidade_atual <= child.estoque_minimo
        });
      }
    }
  });
  
  // Calcular hasLowStock para grupos com filhos baseado nos valores agregados
  groups.forEach(group => {
    if (group.children.length > 0 && group.parentProduct) {
      const calculatedData = calculateParentProductData(group.parentProduct.sku_interno, products);
      // Verifica se está abaixo ou igual ao mínimo (crítico/sem estoque)
      // OU se está entre mínimo e mínimo * 1.5 (estoque baixo)
      group.hasLowStock = calculatedData.quantidade_atual === 0 || 
                          calculatedData.quantidade_atual <= calculatedData.estoque_minimo * 1.5;
    } else if (group.parentProduct && group.children.length === 0) {
      // Produtos sem filhos usam seus próprios valores
      group.hasLowStock = group.parentProduct.quantidade_atual === 0 ||
                          group.parentProduct.quantidade_atual <= group.parentProduct.estoque_minimo * 1.5;
    }
  });
  
  // Adicionar produtos independentes
  independentProducts.forEach(product => {
    groups.set(product.sku_interno, {
      parentSku: product.sku_interno,
      parentProduct: product,
      children: [],
      totalStock: product.quantidade_atual,
      hasLowStock: product.quantidade_atual <= product.estoque_minimo
    });
  });
  
  return Array.from(groups.values()).sort((a, b) => a.parentSku.localeCompare(b.parentSku));
}
