/**
 * 📊 HOOK DE HIERARQUIA DE DEVOLUÇÕES
 * Agrupa devoluções por produto pai (SKU base) para análise consolidada
 * Baseado em useProductHierarchy.ts
 */

import { useMemo } from 'react';

export interface DevolucaoGroup {
  skuBase: string;
  productTitle: string;
  devolucoes: any[];
  totalDevolucoes: number;
  totalQuantidade: number;
  totalValorRetido: number;
  valorMedio: number;
  hasMultipleVariations: boolean;
  variations: string[];
  claimIds: string[];
  statusDistribution: Record<string, number>;
  motivosDistribution: Record<string, number>;
  periodoInicio: string | null;
  periodoFim: string | null;
}

export interface DevolucaoHierarchy {
  groups: DevolucaoGroup[];
  independentDevolucoes: any[];
  totalGroups: number;
  totalIndependent: number;
  groupedCount: number;
  ungroupedCount: number;
  isGrouped: boolean;
}

/**
 * Extrai SKU base removendo sufixos de variação comuns
 * Exemplos:
 * - "PROD-001-P" → "PROD-001"
 * - "PROD-001-M" → "PROD-001"
 * - "PROD-001-G" → "PROD-001"
 * - "PROD-001" → "PROD-001"
 */
const extractBaseSku = (sku: string | null | undefined): string | null => {
  if (!sku) return null;
  
  // Remove sufixos comuns de tamanho/cor/variação
  const patterns = [
    /-[PPMGGG]$/i,           // Tamanhos: P, M, G, PP, GG
    /-[0-9]{1,3}$/,          // Números: -01, -001, -1
    /-[A-Z]{1,2}$/,          // Letras simples: -A, -B, -AB
    /-V[0-9]+$/i,            // Variação: -V1, -V2
    /-TAM[A-Z]+$/i,          // TAM: -TAMP, -TAMM
    /_[PPMGGG]$/i,           // Underscores
    /_[0-9]{1,3}$/,
  ];
  
  let baseSku = sku.trim();
  
  for (const pattern of patterns) {
    baseSku = baseSku.replace(pattern, '');
  }
  
  return baseSku;
};

/**
 * Extrai título base do produto removendo informações de variação
 */
const extractBaseTitle = (title: string | null | undefined): string => {
  if (!title) return 'Produto Sem Título';
  
  // Remove tamanhos, cores e outras variações do título
  const cleanTitle = title
    .replace(/\s*-?\s*Tamanho:?\s*[PPMGGG]+/gi, '')
    .replace(/\s*-?\s*Cor:?\s*\w+/gi, '')
    .replace(/\s*-?\s*[PPMGGG]$/gi, '')
    .replace(/\s*\([^)]*\)$/g, '') // Remove parênteses no final
    .trim();
  
  return cleanTitle || title;
};

export function useDevolucaoHierarchy(
  devolucoes: any[],
  enableGrouping: boolean = true
): DevolucaoHierarchy {
  return useMemo(() => {
    if (!enableGrouping || !devolucoes || devolucoes.length === 0) {
      return {
        groups: [],
        independentDevolucoes: devolucoes || [],
        totalGroups: 0,
        totalIndependent: devolucoes?.length || 0,
        groupedCount: 0,
        ungroupedCount: devolucoes?.length || 0,
        isGrouped: false
      };
    }

    const groupsMap = new Map<string, DevolucaoGroup>();
    const independent: any[] = [];

    // Primeira passagem: identificar SKUs base e agrupar
    devolucoes.forEach(dev => {
      const sku = dev.product_info?.sku || dev.sku;
      const baseSku = extractBaseSku(sku);
      
      if (!baseSku) {
        // Sem SKU ou SKU inválido - independente
        independent.push(dev);
        return;
      }

      const existingGroup = groupsMap.get(baseSku);
      
      if (existingGroup) {
        // Adicionar à group existente
        existingGroup.devolucoes.push(dev);
        existingGroup.totalDevolucoes++;
        existingGroup.totalQuantidade += dev.quantidade || 0;
        existingGroup.totalValorRetido += dev.valor_retido || 0;
        
        // Adicionar variation_id único
        const varId = dev.product_info?.variation_id || dev.variation_id;
        if (varId && !existingGroup.variations.includes(varId)) {
          existingGroup.variations.push(varId);
        }
        
        // Adicionar claim_id
        if (dev.claim_id && !existingGroup.claimIds.includes(dev.claim_id)) {
          existingGroup.claimIds.push(dev.claim_id);
        }
        
        // Atualizar distribuições
        const status = dev.status?.id || dev.status_devolucao || 'unknown';
        existingGroup.statusDistribution[status] = (existingGroup.statusDistribution[status] || 0) + 1;
        
        const motivo = dev.reason?.description || dev.reason_name || 'Não especificado';
        existingGroup.motivosDistribution[motivo] = (existingGroup.motivosDistribution[motivo] || 0) + 1;
        
        // Atualizar período
        const dataCreated = dev.data_criacao || dev.created_at;
        if (dataCreated) {
          if (!existingGroup.periodoInicio || dataCreated < existingGroup.periodoInicio) {
            existingGroup.periodoInicio = dataCreated;
          }
          if (!existingGroup.periodoFim || dataCreated > existingGroup.periodoFim) {
            existingGroup.periodoFim = dataCreated;
          }
        }
      } else {
        // Criar novo grupo
        const titulo = dev.product_info?.title || dev.produto_titulo;
        const baseTitle = extractBaseTitle(titulo);
        const dataCreated = dev.data_criacao || dev.created_at;
        
        const varId = dev.product_info?.variation_id || dev.variation_id;
        const status = dev.status?.id || dev.status_devolucao || 'unknown';
        const motivo = dev.reason?.description || dev.reason_name || 'Não especificado';
        
        groupsMap.set(baseSku, {
          skuBase: baseSku,
          productTitle: baseTitle,
          devolucoes: [dev],
          totalDevolucoes: 1,
          totalQuantidade: dev.quantidade || 0,
          totalValorRetido: dev.valor_retido || 0,
          valorMedio: dev.valor_retido || 0,
          hasMultipleVariations: false,
          variations: varId ? [varId] : [],
          claimIds: dev.claim_id ? [dev.claim_id] : [],
          statusDistribution: { [status]: 1 },
          motivosDistribution: { [motivo]: 1 },
          periodoInicio: dataCreated || null,
          periodoFim: dataCreated || null
        });
      }
    });

    // Segunda passagem: calcular médias e identificar grupos reais vs independentes
    const finalGroups: DevolucaoGroup[] = [];
    
    groupsMap.forEach(group => {
      // Recalcular valor médio
      group.valorMedio = group.totalDevolucoes > 0 
        ? group.totalValorRetido / group.totalDevolucoes 
        : 0;
      
      // Marcar se tem múltiplas variações
      group.hasMultipleVariations = group.variations.length > 1 || group.devolucoes.length > 1;
      
      // Se grupo tem apenas 1 devolução, considerar independente
      if (group.totalDevolucoes === 1) {
        independent.push(group.devolucoes[0]);
      } else {
        finalGroups.push(group);
      }
    });

    // Ordenar grupos por total de devoluções (desc)
    finalGroups.sort((a, b) => b.totalDevolucoes - a.totalDevolucoes);

    const totalGrouped = finalGroups.reduce((sum, g) => sum + g.totalDevolucoes, 0);

    return {
      groups: finalGroups,
      independentDevolucoes: independent,
      totalGroups: finalGroups.length,
      totalIndependent: independent.length,
      groupedCount: totalGrouped,
      ungroupedCount: independent.length,
      isGrouped: true
    };
  }, [devolucoes, enableGrouping]);
}
