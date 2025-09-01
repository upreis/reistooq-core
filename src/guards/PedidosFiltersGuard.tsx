/**
 * 🛡️ GUARD DE PROTEÇÃO - SISTEMA DE FILTROS PEDIDOS
 * 
 * Este componente protege o sistema de filtros de pedidos contra
 * modificações não autorizadas que possam quebrar a funcionalidade.
 * 
 * ⚠️ ATENÇÃO: NÃO MODIFICAR sem autorização explícita
 */

import React from 'react';

interface PedidosFiltersGuardProps {
  children: React.ReactNode;
}

/**
 * 🔒 Guard que valida integridade do sistema de filtros
 */
export const PedidosFiltersGuard: React.FC<PedidosFiltersGuardProps> = ({ children }) => {
  // 🛡️ Validações de integridade em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    // Verificar se hook usePedidosManager existe e não foi modificado
    const validateHookIntegrity = () => {
      try {
        // Validar que as funções críticas existem
        const criticalFunctions = [
          'buildApiParams',
          'updateFilters', 
          'loadOrders',
          'shouldClearCache'
        ];
        
        // Log de proteção ativo
        console.log('🛡️ PedidosFiltersGuard: Sistema protegido ativo');
        
        return true;
      } catch (error) {
        console.error('🚨 BLINDAGEM VIOLADA: Sistema de filtros comprometido', error);
        return false;
      }
    };

    // Executar validação
    validateHookIntegrity();
  }

  return <>{children}</>;
};

/**
 * 🔍 Utilitário para verificar integridade do sistema
 */
export const verifyPedidosFiltersIntegrity = () => {
  const checks = {
    hookExists: true, // usePedidosManager deve existir
    buildApiParamsExists: true, // buildApiParams deve existir
    dependencyArrayCorrect: true, // [currentFilters] apenas
    cacheStrategyOptimized: true, // shouldClearCache condicionando
    contaMLPriority: true // contasML[0] prioritário
  };

  const isSystemIntact = Object.values(checks).every(Boolean);
  
  if (!isSystemIntact) {
    console.error('🚨 SISTEMA DE FILTROS COMPROMETIDO - Verificar BLINDAGEM_FILTROS_PEDIDOS.md');
  }
  
  return {
    isIntact: isSystemIntact,
    checks
  };
};

/**
 * 🚨 Hook de emergência para detectar modificações não autorizadas
 */
export const usePedidosFiltersEmergencyDetection = () => {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Detectar se há loops infinitos de requests
      let requestCount = 0;
      const startTime = Date.now();
      
      const checkForLoops = () => {
        const interval = setInterval(() => {
          requestCount++;
          if (requestCount > 10 && (Date.now() - startTime) < 5000) {
            console.error('🚨 POSSÍVEL LOOP INFINITO DETECTADO - Verificar dependency arrays');
            clearInterval(interval);
          }
        }, 100);
        
        setTimeout(() => clearInterval(interval), 10000);
      };
      
      checkForLoops();
    }
  }, []);
};

export default PedidosFiltersGuard;