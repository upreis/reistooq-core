/**
 * 🎯 MAPEADOR PRINCIPAL DE DEVOLUÇÕES
 * Consolida todos os mapeadores em um só ponto (18 → 8)
 */

import { mapBasicData } from './mappers/BasicDataMapper.ts';
import { mapFinancialData } from './mappers/FinancialDataMapper.ts';
import { mapCommunicationData } from './mappers/CommunicationDataMapper.ts';
import { mapTrackingData } from './mappers/TrackingDataMapper.ts';
import { mapContextData } from './mappers/ContextDataMapper.ts';
import { mapMetadata } from './mappers/MetadataMapper.ts';
import { mapRawData } from './mappers/RawDataMapper.ts';
import { mapPackData } from './mappers/PackDataMapper.ts';

/**
 * Mapeia todos os dados de uma devolução usando mapeadores consolidados
 */
export const mapDevolucaoCompleta = (
  item: any,
  accountId: string,
  accountName: string,
  reasonId: string | null = null
) => {
  return {
    // Grupo 1: Dados Básicos (principais + produto + classificação)
    ...mapBasicData(item, accountId, accountName, reasonId),
    
    // Grupo 2: Dados Financeiros (financeiros + pagamento)
    ...mapFinancialData(item),
    
    // Grupo 3: Comunicação (mensagens + timeline + anexos)
    ...mapCommunicationData(item),
    
    // Grupo 4: Rastreamento (tracking + review)
    ...mapTrackingData(item),
    
    // Grupo 5: Contextuais (mediação + troca + adicionais + comprador)
    ...mapContextData(item),
    
    // Grupo 6: Metadados (flags + qualidade + reputação + SLA)
    ...mapMetadata(item),
    
    // Grupo 7: Dados de Pack, Cancelamento e Custom Fields (FASE 2)
    ...mapPackData(item),
    
    // ✅ CRÍTICO: Dados do Produto Enriquecidos (thumbnail, SKU, variation_id, category_id)
    product_info: item.product_info || null,
    
    // Grupo 8: Dados Brutos (raw data)
    raw: mapRawData(item)
  };
};
