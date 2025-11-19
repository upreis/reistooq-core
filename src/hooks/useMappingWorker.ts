/**
 * 🔧 HOOK PARA USAR WEB WORKER DE MAPEAMENTO
 * Integração clean com o worker de cálculos
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface WorkerState {
  isWorking: boolean;
  error: string | null;
  lastProcessingTime?: number;
}

interface MappingResult {
  orderId: string;
  numero: string;
  temMapeamento: boolean;
  mappedSkus: string[];
  unmappedSkus: string[];
  mappingPercentage: number;
}

interface FinancialResult {
  orderId: string;
  valorTotal: number;
  receitaFlex: number;
  marketplaceFee: number;
  valorLiquido: number;
  margin: number;
  isFlexOrder: boolean;
  profitabilityScore: 'alta' | 'media' | 'baixa';
}

interface ValidationResult {
  orderId: string;
  isValid: boolean;
  hasWarnings: boolean;
  issues: string[];
  warnings: string[];
  score: number;
}

export function useMappingWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<WorkerState>({
    isWorking: false,
    error: null
  });

  const [results, setResults] = useState<{
    mappings: Map<string, MappingResult>;
    financials: Map<string, FinancialResult>;
    validations: Map<string, ValidationResult>;
  }>({
    mappings: new Map(),
    financials: new Map(),
    validations: new Map()
  });

  // Inicializar worker
  useEffect(() => {
    let isCleanedUp = false; // ✅ Flag para prevenir uso após cleanup
    
    if (typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker(
          new URL('../workers/mapping-calculator.ts', import.meta.url),
          { type: 'module' }
        );

        workerRef.current.onmessage = (e) => {
          // ✅ Ignorar mensagens se worker já foi terminado
          if (isCleanedUp || !workerRef.current) {
            console.warn('⚠️ Mensagem recebida de worker já encerrado, ignorando');
            return;
          }
          const { type, payload, id } = e.data;

          setState(prev => ({ ...prev, isWorking: false }));

          switch (type) {
            case 'MAPPING_RESULT':
              setResults(prev => {
                const newMappings = new Map(prev.mappings);
                payload.mappings.forEach((mapping: MappingResult) => {
                  newMappings.set(mapping.orderId, mapping);
                });
                return { ...prev, mappings: newMappings };
              });
              setState(prev => ({
                ...prev,
                lastProcessingTime: payload.processingTime
              }));
              break;

            case 'FINANCIAL_RESULT':
              setResults(prev => {
                const newFinancials = new Map(prev.financials);
                payload.financials.forEach((financial: FinancialResult) => {
                  newFinancials.set(financial.orderId, financial);
                });
                return { ...prev, financials: newFinancials };
              });
              setState(prev => ({
                ...prev,
                lastProcessingTime: payload.processingTime
              }));
              break;

            case 'VALIDATION_RESULT':
              setResults(prev => {
                const newValidations = new Map(prev.validations);
                payload.validations.forEach((validation: ValidationResult) => {
                  newValidations.set(validation.orderId, validation);
                });
                return { ...prev, validations: newValidations };
              });
              setState(prev => ({
                ...prev,
                lastProcessingTime: payload.processingTime
              }));
              break;

            case 'ERROR':
              setState(prev => ({
                ...prev,
                error: payload.message,
                isWorking: false
              }));
              break;
          }
        };

        workerRef.current.onerror = (error) => {
          setState(prev => ({
            ...prev,
            error: 'Erro no Web Worker: ' + error.message,
            isWorking: false
          }));
        };
      } catch (error) {
        console.warn('Web Workers não suportados, usando processamento no thread principal');
        setState(prev => ({
          ...prev,
          error: 'Web Workers não suportados'
        }));
      }
    }

    return () => {
      isCleanedUp = true; // ✅ Marcar como limpo
      if (workerRef.current) {
        try {
          workerRef.current.terminate();
        } catch (error) {
          console.warn('⚠️ Erro ao terminar worker:', error);
        } finally {
          workerRef.current = null;
        }
      }
    };
  }, []);

  // Calcular mapeamentos
  const calculateMappings = useCallback((orders: any[], mapeamentos: any[]) => {
    if (!workerRef.current) {
      console.warn('Worker não disponível, processando no thread principal');
      setState(prev => ({ ...prev, error: 'Worker não disponível' }));
      return;
    }

    setState(prev => ({ ...prev, isWorking: true, error: null }));

    try {
      workerRef.current.postMessage({
        type: 'CALCULATE_MAPPINGS',
        payload: {
          orders,
          mapeamentos,
          startTime: Date.now()
        },
        id: `mapping-${Date.now()}`
      });
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem para worker:', error);
      setState(prev => ({ 
        ...prev, 
        isWorking: false,
        error: 'Falha ao comunicar com worker - canal fechado'
      }));
    }
  }, []);

  // Calcular métricas financeiras
  const calculateFinancials = useCallback((orders: any[]) => {
    if (!workerRef.current) {
      console.warn('Worker não disponível');
      setState(prev => ({ ...prev, error: 'Worker não disponível' }));
      return;
    }

    setState(prev => ({ ...prev, isWorking: true, error: null }));

    try {
      workerRef.current.postMessage({
        type: 'CALCULATE_FINANCIAL',
        payload: {
          orders,
          startTime: Date.now()
        },
        id: `financial-${Date.now()}`
      });
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem para worker:', error);
      setState(prev => ({ 
        ...prev, 
        isWorking: false,
        error: 'Falha ao comunicar com worker - canal fechado'
      }));
    }
  }, []);

  // Validar pedidos
  const validateOrders = useCallback((orders: any[]) => {
    if (!workerRef.current) {
      console.warn('Worker não disponível');
      setState(prev => ({ ...prev, error: 'Worker não disponível' }));
      return;
    }

    setState(prev => ({ ...prev, isWorking: true, error: null }));

    try {
      workerRef.current.postMessage({
        type: 'VALIDATE_ORDERS',
        payload: {
          orders,
          startTime: Date.now()
        },
        id: `validation-${Date.now()}`
      });
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem para worker:', error);
      setState(prev => ({ 
        ...prev, 
        isWorking: false,
        error: 'Falha ao comunicar com worker - canal fechado'
      }));
    }
  }, []);

  // Helpers para acessar resultados
  const getMappingResult = useCallback((orderId: string) => {
    return results.mappings.get(orderId);
  }, [results.mappings]);

  const getFinancialResult = useCallback((orderId: string) => {
    return results.financials.get(orderId);
  }, [results.financials]);

  const getValidationResult = useCallback((orderId: string) => {
    return results.validations.get(orderId);
  }, [results.validations]);

  // Limpar resultados
  const clearResults = useCallback(() => {
    setResults({
      mappings: new Map(),
      financials: new Map(),
      validations: new Map()
    });
  }, []);

  // Estatísticas agregadas
  const getAggregateStats = useCallback(() => {
    const mappingStats = {
      total: results.mappings.size,
      mapped: Array.from(results.mappings.values()).filter(r => r.temMapeamento).length,
      avgPercentage: Array.from(results.mappings.values())
        .reduce((acc, r) => acc + r.mappingPercentage, 0) / results.mappings.size || 0
    };

    const financialStats = {
      total: results.financials.size,
      totalRevenue: Array.from(results.financials.values())
        .reduce((acc, r) => acc + r.valorTotal, 0),
      flexOrders: Array.from(results.financials.values()).filter(r => r.isFlexOrder).length,
      avgMargin: Array.from(results.financials.values())
        .reduce((acc, r) => acc + r.margin, 0) / results.financials.size || 0
    };

    const validationStats = {
      total: results.validations.size,
      valid: Array.from(results.validations.values()).filter(r => r.isValid).length,
      withWarnings: Array.from(results.validations.values()).filter(r => r.hasWarnings).length,
      avgScore: Array.from(results.validations.values())
        .reduce((acc, r) => acc + r.score, 0) / results.validations.size || 0
    };

    return { mappingStats, financialStats, validationStats };
  }, [results]);

  return {
    // Estado
    isWorking: state.isWorking,
    error: state.error,
    lastProcessingTime: state.lastProcessingTime,
    
    // Ações
    calculateMappings,
    calculateFinancials,
    validateOrders,
    clearResults,
    
    // Acessadores
    getMappingResult,
    getFinancialResult,
    getValidationResult,
    getAggregateStats,
    
    // Resultados brutos
    results
  };
}

export default useMappingWorker;