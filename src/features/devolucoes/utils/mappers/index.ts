/**
 * 🎯 MAPEADOR PRINCIPAL DE DEVOLUÇÕES
 * Consolida todos os mapeadores em um só ponto (18 → 8)
 */

import { mapBasicData } from './BasicDataMapper';
import { mapFinancialData } from './FinancialDataMapper';
import { mapCommunicationData } from './CommunicationDataMapper';
import { mapTrackingData } from './TrackingDataMapper';
import { mapContextData } from './ContextDataMapper';
import { mapMetadata } from './MetadataMapper';
import { mapRawData } from './RawDataMapper';
import { mapPackData } from './PackDataMapper';

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
    
    // Grupo 8: Dados Brutos (raw data)
    raw: mapRawData(item)
  };
};

// Exportar também os mapeadores individuais para casos especiais
export {
  mapBasicData,
  mapFinancialData,
  mapCommunicationData,
  mapTrackingData,
  mapContextData,
  mapMetadata,
  mapPackData,
  mapRawData
};
