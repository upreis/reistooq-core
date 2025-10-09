import { Product } from "@/hooks/useProducts";

export interface SkuGroup {
  parentSku: string;
  parentProduct?: Product;
  children: Product[];
  totalStock: number;
  hasLowStock: boolean;
}

export function groupProductsBySku(products: Product[]): SkuGroup[] {
  const groups = new Map<string, SkuGroup>();
  const ungroupedProducts: Product[] = [];

  // Primeiro, identificar todos os SKUs pai usando o campo sku_pai do banco
  products.forEach(product => {
    // Se tem sku_pai definido, é um filho
    if (product.sku_pai) {
      const parentSku = product.sku_pai;
      
      if (!groups.has(parentSku)) {
        groups.set(parentSku, {
          parentSku,
          children: [],
          totalStock: 0,
          hasLowStock: false
        });
      }
      
      const group = groups.get(parentSku)!;
      group.children.push(product);
      group.totalStock += product.quantidade_atual;
      
      if (product.quantidade_atual <= product.estoque_minimo) {
        group.hasLowStock = true;
      }
    } else {
      // Não tem sku_pai, pode ser pai ou produto independente
      const hasChildren = products.some(p => p.sku_pai === product.sku_interno);
      
      if (hasChildren) {
        // É um SKU pai
        if (!groups.has(product.sku_interno)) {
          groups.set(product.sku_interno, {
            parentSku: product.sku_interno,
            parentProduct: product,
            children: [],
            totalStock: product.quantidade_atual,
            hasLowStock: product.quantidade_atual <= product.estoque_minimo
          });
        } else {
          const group = groups.get(product.sku_interno)!;
          group.parentProduct = product;
          group.totalStock += product.quantidade_atual;
        }
      } else {
        // Produto independente (sem pai e sem filhos)
        ungroupedProducts.push(product);
      }
    }
  });

  // Converter grupos para array e adicionar produtos independentes como grupos de 1
  const result = Array.from(groups.values());
  
  ungroupedProducts.forEach(product => {
    result.push({
      parentSku: product.sku_interno,
      parentProduct: product,
      children: [],
      totalStock: product.quantidade_atual,
      hasLowStock: product.quantidade_atual <= product.estoque_minimo
    });
  });

  return result.sort((a, b) => a.parentSku.localeCompare(b.parentSku));
}
