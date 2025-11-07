/**
 * 🏷️ BADGES DE STATUS DE ESTOQUE
 * Componentes de badges para produtos PAI, FILHO, ÓRFÃO e status de estoque
 */

import { Badge } from "@/components/ui/badge";
import { Product } from "@/hooks/useProducts";
import { Package, Layers, AlertTriangle } from "lucide-react";
import { calculateParentProductData } from "@/utils/parentProductCalculations";

export interface StockBadgeData {
  type: string;
  label: string;
  className: string;
}

/**
 * Determina o badge de status de estoque de um produto
 */
export const getStockBadge = (product: Product): StockBadgeData | null => {
  // Sem estoque (prioridade máxima)
  if (product.quantidade_atual === 0) {
    return {
      type: 'sem_estoque',
      label: 'Sem estoque',
      className: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
  }
  
  // Crítico (quantidade <= estoque mínimo)
  if (product.quantidade_atual <= product.estoque_minimo) {
    return {
      type: 'critico',
      label: 'Estoque crítico',
      className: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
  }
  
  // Estoque baixo (quantidade > mínimo mas <= mínimo * 1.5)
  if (product.quantidade_atual <= product.estoque_minimo * 1.5) {
    return {
      type: 'baixo',
      label: 'Estoque baixo',
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    };
  }
  
  // Estoque alto (quantidade >= máximo)
  if (product.quantidade_atual >= product.estoque_maximo) {
    return {
      type: 'alto',
      label: 'Estoque alto',
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };
  }
  
  // Normal (entre mínimo * 1.5 e máximo)
  return {
    type: 'normal',
    label: 'Estoque normal',
    className: 'bg-green-500/20 text-green-400 border-green-500/30'
  };
};

interface ProductTypeBadgesProps {
  isParent: boolean;
  isChild: boolean;
}

/**
 * Badges de tipo de produto (PAI/FILHO) com indentação visual
 */
export function ProductTypeBadges({ isParent, isChild }: ProductTypeBadgesProps) {
  if (isParent) {
    return (
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-1 h-8 bg-primary rounded-full flex-shrink-0" />
        <div className="flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-primary" />
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30 font-semibold">
            PAI
          </Badge>
        </div>
      </div>
    );
  }
  
  if (isChild) {
    return (
      <div className="flex items-center gap-2 flex-shrink-0 ml-6">
        <div className="flex items-center gap-1">
          <div className="w-4 h-[2px] bg-blue-500/50" />
          <div className="w-1 h-6 bg-blue-500/70 rounded-full flex-shrink-0" />
        </div>
        <div className="flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-blue-400" />
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-500/5 text-blue-300 border-blue-500/20">
            FILHO
          </Badge>
        </div>
      </div>
    );
  }
  
  return null;
}

interface StatusBadgesProps {
  product: Product;
  isParent: boolean;
  isOrphan: boolean;
  allProducts?: Product[]; // Necessário para calcular valores de produtos PAI
}

/**
 * Badges de status (Órfão, Status de Estoque)
 * Para produtos PAI, o status é calculado baseado nos valores agregados dos filhos
 */
export function StatusBadges({ product, isParent, isOrphan, allProducts = [] }: StatusBadgesProps) {
  // Se for produto PAI e tivermos todos os produtos, calcular valores agregados
  let productForBadge = product;
  if (isParent && allProducts.length > 0) {
    const calculatedData = calculateParentProductData(product.sku_interno, allProducts);
    productForBadge = {
      ...product,
      quantidade_atual: calculatedData.quantidade_atual,
      estoque_minimo: calculatedData.estoque_minimo,
      estoque_maximo: calculatedData.estoque_maximo,
    };
  }
  
  const stockBadge = getStockBadge(productForBadge);
  
  return (
    <div className="flex flex-wrap gap-1 ml-0">
      {isOrphan && (
        <div className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-orange-400" />
          <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 border-orange-500/30 font-semibold">
            ⚠️ Órfão
          </Badge>
        </div>
      )}
      
      {stockBadge && (
        <Badge 
          variant="outline" 
          className={`text-[9px] px-1.5 py-0.5 ${stockBadge.className}`}
        >
          {stockBadge.label}
        </Badge>
      )}
    </div>
  );
}

interface ActiveStatusBadgeProps {
  isActive: boolean;
}

/**
 * Badge de status ativo/inativo
 */
export function ActiveStatusBadge({ isActive }: ActiveStatusBadgeProps) {
  return (
    <Badge 
      variant={isActive ? "default" : "secondary"} 
      className="text-[10px] px-2 py-0.5"
    >
      {isActive ? "Ativo" : "Inativo"}
    </Badge>
  );
}

interface OnDemandBadgeProps {
  isOnDemand: boolean;
}

/**
 * Badge de sob encomenda
 */
export function OnDemandBadge({ isOnDemand }: OnDemandBadgeProps) {
  return (
    <Badge 
      variant={isOnDemand ? "default" : "outline"} 
      className="text-[10px] px-2 py-0.5"
    >
      {isOnDemand ? "Sim" : "Não"}
    </Badge>
  );
}
