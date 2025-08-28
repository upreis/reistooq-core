import { useEffect } from 'react';

// 🔧 SISTEMA DE VALIDAÇÃO AUTOMÁTICA REISTOQ
// Detecta problemas em tempo real durante desenvolvimento

interface ValidationResult {
  type: 'error' | 'warning' | 'info';
  category: 'router' | 'hooks' | 'security' | 'performance' | 'types';
  message: string;
  location?: string;
  fix?: string;
}

class SystemValidator {
  private static instance: SystemValidator;
  private validationResults: ValidationResult[] = [];
  private isEnabled = true;

  static getInstance(): SystemValidator {
    if (!SystemValidator.instance) {
      SystemValidator.instance = new SystemValidator();
    }
    return SystemValidator.instance;
  }

  // 🔍 VALIDAÇÃO DE ROUTER ÚNICO
  private validateRouter(): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Verificar se existe Router duplicado
    const routerElements = document.querySelectorAll('[data-router-context]');
    if (routerElements.length > 1) {
      results.push({
        type: 'error',
        category: 'router',
        message: `ERRO CRÍTICO: ${routerElements.length} Routers detectados! Máximo permitido: 1`,
        fix: 'Mover BrowserRouter apenas para main.tsx e usar Routes em App.tsx'
      });
    }

    return results;
  }

  // 🎣 VALIDAÇÃO DE HOOKS
  private validateHooks(): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Simular verificação de hooks condicionais
    // (em um ambiente real, isso seria feito via babel plugin ou AST)
    
    return results;
  }

  // 🔒 VALIDAÇÃO DE SEGURANÇA
  private validateSecurity(): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Verificar se há dados sensíveis expostos no localStorage
    try {
      const storage = localStorage.getItem('reistoq.auth');
      if (storage && storage.includes('password')) {
        results.push({
          type: 'error',
          category: 'security',
          message: 'ERRO DE SEGURANÇA: Senha encontrada no localStorage',
          fix: 'Remover dados sensíveis do localStorage'
        });
      }
    } catch (e) {
      // Ignorar erros de acesso ao localStorage
    }

    // Verificar console logs suspeitos
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      const message = args.join(' ').toLowerCase();
      if (message.includes('password') || message.includes('secret') || message.includes('token')) {
        results.push({
          type: 'error',
          category: 'security',
          message: 'ERRO DE SEGURANÇA: Log com dados sensíveis detectado',
          fix: 'Remover console.log com dados sensíveis'
        });
      }
      originalLog.apply(console, args);
    };

    return results;
  }

  // ⚡ VALIDAÇÃO DE PERFORMANCE
  private validatePerformance(): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Verificar re-renders excessivos
    const startTime = performance.now();
    const renderThreshold = 50; // ms
    
    setTimeout(() => {
      const renderTime = performance.now() - startTime;
      if (renderTime > renderThreshold) {
        results.push({
          type: 'warning',
          category: 'performance',
          message: `Render lento detectado: ${renderTime.toFixed(2)}ms`,
          fix: 'Verificar re-renders desnecessários ou componentes pesados'
        });
      }
    }, 0);

    return results;
  }

  // 📊 VALIDAÇÃO DE TIPOS TYPESCRIPT
  private validateTypes(): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Verificar se há muitos 'any' no runtime
    const anyUsageCount = document.querySelectorAll('[data-type="any"]').length;
    if (anyUsageCount > 5) {
      results.push({
        type: 'warning',
        category: 'types',
        message: `Muitos tipos 'any' detectados: ${anyUsageCount}`,
        fix: 'Implementar tipagem específica para melhor type safety'
      });
    }

    return results;
  }

  // 🔄 EXECUTAR TODAS AS VALIDAÇÕES
  public runValidation(): ValidationResult[] {
    if (!this.isEnabled) return [];

    this.validationResults = [
      ...this.validateRouter(),
      ...this.validateHooks(),
      ...this.validateSecurity(),
      ...this.validatePerformance(),
      ...this.validateTypes()
    ];

    this.reportResults();
    return this.validationResults;
  }

  // 📢 REPORTAR RESULTADOS
  private reportResults(): void {
    const errors = this.validationResults.filter(r => r.type === 'error');
    const warnings = this.validationResults.filter(r => r.type === 'warning');

    if (errors.length > 0) {
      console.group('🚨 ERROS CRÍTICOS DETECTADOS');
      errors.forEach(error => {
        console.error(`❌ [${error.category.toUpperCase()}] ${error.message}`);
        if (error.fix) {
          console.info(`💡 Solução: ${error.fix}`);
        }
      });
      console.groupEnd();
    }

    if (warnings.length > 0) {
      console.group('⚠️ AVISOS DE QUALIDADE');
      warnings.forEach(warning => {
        console.warn(`⚠️ [${warning.category.toUpperCase()}] ${warning.message}`);
        if (warning.fix) {
          console.info(`💡 Recomendação: ${warning.fix}`);
        }
      });
      console.groupEnd();
    }

    if (errors.length === 0 && warnings.length === 0) {
      // Reduzir spam no console - só logar em desenvolvimento se necessário
      if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
        console.log('✅ Sistema validado com sucesso - Nenhum problema detectado');
      }
    }
  }

  // ⚙️ CONFIGURAÇÃO
  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public getResults(): ValidationResult[] {
    return this.validationResults;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  // 🔔 MONITORAMENTO CONTÍNUO
  public startContinuousMonitoring(): void {
    if (!this.isEnabled) return;

    // Validação inicial
    this.runValidation();

    // Monitorar mudanças no DOM
    const observer = new MutationObserver(() => {
      setTimeout(() => this.runValidation(), 1000);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });

    // Validação periódica reduzida para evitar overhead
    setInterval(() => {
      this.runValidation();
    }, 300000); // A cada 5 minutos ao invés de 30 segundos
  }
}

// 🎯 HOOK PARA USAR O VALIDATOR EM COMPONENTES
export function useSystemValidator() {
  const validator = SystemValidator.getInstance();
  // Iniciar monitoramento apenas uma vez, com throttling
  useEffect(() => {
    let mounted = true;
    
    // Delay inicial para evitar multiple calls
    const timer = setTimeout(() => {
      if (mounted) {
        validator.startContinuousMonitoring();
      }
    }, 1000);
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []); // Dependency array vazia para rodar apenas uma vez

  return {
    runValidation: () => validator.runValidation(),
    enable: () => validator.enable(),
    disable: () => validator.disable(),
    isEnabled: validator.getIsEnabled()
  };
}

// 🚀 INICIALIZAÇÃO AUTOMÁTICA EM DESENVOLVIMENTO
if (process.env.NODE_ENV === 'development') {
  const validator = SystemValidator.getInstance();
  
  // Aguardar o DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      validator.startContinuousMonitoring();
    });
  } else {
    validator.startContinuousMonitoring();
  }

  // Expor no window para debug manual
  (window as any).reistoqValidator = validator;
  
  console.log('🛡️ REISTOQ System Validator ativado');
  console.log('💡 Use window.reistoqValidator para controle manual');
}

export default SystemValidator;