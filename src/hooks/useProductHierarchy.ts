import { useMemo } from 'react';
import { Product } from '@/hooks/useProducts';

export interface ProductHierarchy {
  parentProducts: Product[];
  childProducts: Product[];
  independentProducts: Product[];
  productGroups: ProductGroup[];
  getChildrenOf: (parentSku: string) => Product[];
  getParentOf: (childProduct: Product) => Product | null;
  isParent: (product: Product) => boolean;
  isChild: (product: Product) => boolean;
  isIndependent: (product: Product) => boolean;
}

export interface ProductGroup {
  parentSku: string;
  parentProduct?: Product;
  children: Product[];
  totalStock: number;
  totalValue: number;
  hasLowStock: boolean;
  hasOutOfStock: boolean;
  averagePrice: number;
}

export function useProductHierarchy(products: Product[]): ProductHierarchy {
  return useMemo(() => {
    const parentProducts: Product[] = [];
    const childProducts: Product[] = [];
    const independentProducts: Product[] = [];
    const productGroups: ProductGroup[] = [];
    const groupsMap = new Map<string, ProductGroup>();

    // Primeira passada: classificar produtos
    products.forEach(product => {
      if (product.sku_pai) {
        childProducts.push(product);
      } else {
        const hasChildren = products.some(p => p.sku_pai === product.sku_interno);
        if (hasChildren) {
          parentProducts.push(product);
        } else {
          independentProducts.push(product);
        }
      }
    });

    // Segunda passada: criar grupos
    parentProducts.forEach(parent => {
      const children = products.filter(p => p.sku_pai === parent.sku_interno);
      const totalStock = parent.quantidade_atual + children.reduce((sum, child) => sum + child.quantidade_atual, 0);
      const totalValue = (parent.preco_venda || 0) * parent.quantidade_atual + 
                        children.reduce((sum, child) => sum + (child.preco_venda || 0) * child.quantidade_atual, 0);
      
      const group: ProductGroup = {
        parentSku: parent.sku_interno,
        parentProduct: parent,
        children,
        totalStock,
        totalValue,
        hasLowStock: parent.quantidade_atual <= parent.estoque_minimo || 
                     children.some(child => child.quantidade_atual <= child.estoque_minimo),
        hasOutOfStock: parent.quantidade_atual === 0 || children.some(child => child.quantidade_atual === 0),
        averagePrice: totalStock > 0 ? totalValue / totalStock : 0
      };

      groupsMap.set(parent.sku_interno, group);
      productGroups.push(group);
    });

    // Grupos órfãos (filhos sem pai)
    childProducts.forEach(child => {
      if (child.sku_pai && !groupsMap.has(child.sku_pai)) {
        const existingGroup = groupsMap.get(child.sku_pai);
        if (!existingGroup) {
          const orphanGroup: ProductGroup = {
            parentSku: child.sku_pai,
            children: [child],
            totalStock: child.quantidade_atual,
            totalValue: (child.preco_venda || 0) * child.quantidade_atual,
            hasLowStock: child.quantidade_atual <= child.estoque_minimo,
            hasOutOfStock: child.quantidade_atual === 0,
            averagePrice: child.preco_venda || 0
          };
          groupsMap.set(child.sku_pai, orphanGroup);
          productGroups.push(orphanGroup);
        }
      }
    });

    const getChildrenOf = (parentSku: string): Product[] => {
      return products.filter(p => p.sku_pai === parentSku);
    };

    const getParentOf = (childProduct: Product): Product | null => {
      if (!childProduct.sku_pai) return null;
      return products.find(p => p.sku_interno === childProduct.sku_pai) || null;
    };

    const isParent = (product: Product): boolean => {
      return parentProducts.some(p => p.id === product.id);
    };

    const isChild = (product: Product): boolean => {
      return childProducts.some(p => p.id === product.id);
    };

    const isIndependent = (product: Product): boolean => {
      return independentProducts.some(p => p.id === product.id);
    };

    return {
      parentProducts,
      childProducts,
      independentProducts,
      productGroups,
      getChildrenOf,
      getParentOf,
      isParent,
      isChild,
      isIndependent
    };
  }, [products]);
}
