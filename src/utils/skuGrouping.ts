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

  products.forEach(product => {
    const parentSku = extractParentSku(product.sku_interno);
    
    if (parentSku && parentSku !== product.sku_interno) {
      // É um SKU filho
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
      // Pode ser um SKU pai ou produto independente
      const hasChildren = products.some(p => 
        extractParentSku(p.sku_interno) === product.sku_interno
      );
      
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
          groups.get(product.sku_interno)!.parentProduct = product;
        }
      } else {
        // Produto independente
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

function extractParentSku(sku: string): string {
  // Extrair SKU pai baseado no padrão CMD-29-VERD-1 -> CMD-29
  const parts = sku.split('-');
  if (parts.length >= 3) {
    return parts.slice(0, 2).join('-');
  }
  return sku;
}
