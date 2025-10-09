import { Product } from "@/hooks/useProducts";

export interface SkuGroup {
  parentSku: string;
  parentProduct?: Product;
  children: Product[];
  totalStock: number;
  hasLowStock: boolean;
}

export function groupProductsBySku(products: Product[]): SkuGroup[] {
  // NOVA LÓGICA: Todos os produtos são tratados como independentes
  // Não há hierarquia pai/filho por enquanto
  return products.map(product => ({
    parentSku: product.sku_interno,
    parentProduct: product,
    children: [],
    totalStock: product.quantidade_atual,
    hasLowStock: product.quantidade_atual <= product.estoque_minimo
  })).sort((a, b) => a.parentSku.localeCompare(b.parentSku));
}
