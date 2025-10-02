import { useCallback } from 'react';
import { useToastFeedback } from '@/hooks/useToastFeedback';
import { useCotacoesInternacionais } from '@/hooks/useCotacoesInternacionais';
import { 
  cotacaoInternacionalSchema, 
  sanitizeInput, 
  sanitizeNumericInput,
  validateUserPermissions,
  checkRateLimit,
  logSecurityEvent
} from '@/utils/inputValidation';
import { ErrorHandler } from '@/utils/errorHandler';

interface CotacaoSecura {
  numero_cotacao: string;
  descricao: string;
  pais_origem: string;
  moeda_origem: string;
  fator_multiplicador: number;
  data_abertura: string;
  data_fechamento?: string;
  status: string;
  observacoes?: string;
  produtos: any[];
  total_peso_kg?: number;
  total_cbm?: number;
  total_quantidade?: number;
  total_valor_origem?: number;
  total_valor_usd?: number;
  total_valor_brl?: number;
}

export function useSecureCotacoes() {
  const { showError, showSuccess } = useToastFeedback();
  const { 
    createCotacaoInternacional, 
    updateCotacaoInternacional, 
    deleteCotacaoInternacional,
    loading 
  } = useCotacoesInternacionais();

  const validateAndSanitizeCotacao = useCallback((cotacao: any, silent = false): CotacaoSecura | null => {
    try {
      // Sanitizar strings
      const sanitizedCotacao = {
        ...cotacao,
        numero_cotacao: sanitizeInput(cotacao.numero_cotacao || ''),
        descricao: sanitizeInput(cotacao.descricao || ''),
        pais_origem: sanitizeInput(cotacao.pais_origem || ''),
        moeda_origem: sanitizeInput(cotacao.moeda_origem || '').toUpperCase(),
        observacoes: cotacao.observacoes ? sanitizeInput(cotacao.observacoes) : undefined,
        fator_multiplicador: sanitizeNumericInput(cotacao.fator_multiplicador) || 1,
        total_peso_kg: sanitizeNumericInput(cotacao.total_peso_kg) || undefined,
        total_cbm: sanitizeNumericInput(cotacao.total_cbm) || undefined,
        total_quantidade: sanitizeNumericInput(cotacao.total_quantidade) || undefined,
        total_valor_origem: sanitizeNumericInput(cotacao.total_valor_origem) || undefined,
        total_valor_usd: sanitizeNumericInput(cotacao.total_valor_usd) || undefined,
        total_valor_brl: sanitizeNumericInput(cotacao.total_valor_brl) || undefined
      };

      // Validar com schema Zod
      const result = cotacaoInternacionalSchema.safeParse(sanitizedCotacao);
      
      if (!result.success) {
        const errors = result.error.issues.map(err => err.message).join(', ');
        
        logSecurityEvent({
          type: 'validation_failure',
          details: { 
            errors: result.error.issues,
            input: sanitizedCotacao 
          },
          severity: 'medium'
        });
        
        // Só mostrar erro se não for modo silencioso
        if (!silent) {
          showError(`Dados inválidos: ${errors}`);
        }
        return null;
      }

      return result.data as CotacaoSecura;
    } catch (error) {
      const errorDetails = ErrorHandler.capture(error, {
        component: 'useSecureCotacoes',
        action: 'validateAndSanitizeCotacao'
      });
      
      // Só mostrar erro se não for modo silencioso
      if (!silent) {
        showError(ErrorHandler.getUserMessage(errorDetails));
      }
      return null;
    }
  }, [showError]);

  const secureCreateCotacao = useCallback(async (cotacao: any) => {
    try {
      // Verificar permissões
      if (!validateUserPermissions(['cotacoes:create'])) {
        logSecurityEvent({
          type: 'sensitive_access',
          details: { action: 'create_cotacao', denied: true },
          severity: 'high'
        });
        showError('Você não tem permissão para criar cotações');
        return null;
      }

      // Verificar rate limit
      if (!checkRateLimit('create_cotacao', 10, 60000)) { // 10 criações por minuto
        logSecurityEvent({
          type: 'validation_failure',
          details: { reason: 'rate_limit_exceeded', action: 'create_cotacao' },
          severity: 'medium'
        });
        showError('Muitas tentativas. Aguarde um momento antes de tentar novamente.');
        return null;
      }

      const sanitizedCotacao = validateAndSanitizeCotacao(cotacao);
      if (!sanitizedCotacao) return null;

      const result = await createCotacaoInternacional(sanitizedCotacao);
      
      if (result) {
        logSecurityEvent({
          type: 'sensitive_access',
          details: { 
            action: 'create_cotacao', 
            cotacao_id: result.id,
            success: true 
          },
          severity: 'low'
        });
        showSuccess('Cotação criada com sucesso!');
      }
      
      return result;
    } catch (error) {
      const errorDetails = ErrorHandler.capture(error, {
        component: 'useSecureCotacoes',
        action: 'secureCreateCotacao'
      });
      
      logSecurityEvent({
        type: 'validation_failure',
        details: { error: errorDetails, action: 'create_cotacao' },
        severity: 'high'
      });
      
      showError(ErrorHandler.getUserMessage(errorDetails));
      return null;
    }
  }, [createCotacaoInternacional, validateAndSanitizeCotacao, showError, showSuccess]);

  // ✅ Versão silenciosa do update para auto-save (sem toasts)
  const silentUpdateCotacao = useCallback(async (id: string, cotacao: any) => {
    try {
      // Verificar permissões
      if (!validateUserPermissions(['cotacoes:update'])) {
        console.warn('⚠️ Auto-save: Sem permissão para atualizar');
        return null;
      }

      // Verificar rate limit
      if (!checkRateLimit('update_cotacao', 20, 60000)) {
        console.warn('⚠️ Auto-save: Rate limit atingido');
        return null;
      }

      const sanitizedCotacao = validateAndSanitizeCotacao(cotacao);
      if (!sanitizedCotacao) {
        console.warn('⚠️ Auto-save: Dados inválidos, aguardando preenchimento');
        return null;
      }

      const result = await updateCotacaoInternacional(id, sanitizedCotacao);
      
      if (result) {
        logSecurityEvent({
          type: 'sensitive_access',
          details: { 
            action: 'auto_save_cotacao', 
            cotacao_id: id,
            success: true 
          },
          severity: 'low'
        });
        console.log('✅ Auto-save: Cotação atualizada silenciosamente');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Auto-save: Erro ao atualizar', error);
      return null;
    }
  }, [updateCotacaoInternacional, validateAndSanitizeCotacao]);

  // ✅ Versão silenciosa do create para auto-save (sem toasts)
  const silentCreateCotacao = useCallback(async (cotacao: any) => {
    try {
      // Verificar permissões
      if (!validateUserPermissions(['cotacoes:create'])) {
        console.warn('⚠️ Auto-save: Sem permissão para criar');
        return null;
      }

      // Verificar rate limit
      if (!checkRateLimit('create_cotacao', 10, 60000)) {
        console.warn('⚠️ Auto-save: Rate limit atingido');
        return null;
      }

      const sanitizedCotacao = validateAndSanitizeCotacao(cotacao);
      if (!sanitizedCotacao) {
        console.warn('⚠️ Auto-save: Dados inválidos, aguardando preenchimento');
        return null;
      }

      const result = await createCotacaoInternacional(sanitizedCotacao);
      
      if (result) {
        logSecurityEvent({
          type: 'sensitive_access',
          details: { 
            action: 'auto_create_cotacao', 
            cotacao_id: result.id,
            success: true 
          },
          severity: 'low'
        });
        console.log('✅ Auto-save: Cotação criada silenciosamente');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Auto-save: Erro ao criar', error);
      return null;
    }
  }, [createCotacaoInternacional, validateAndSanitizeCotacao]);

  const secureUpdateCotacao = useCallback(async (id: string, cotacao: any) => {
    try {
      // Verificar permissões
      if (!validateUserPermissions(['cotacoes:update'])) {
        logSecurityEvent({
          type: 'sensitive_access',
          details: { action: 'update_cotacao', cotacao_id: id, denied: true },
          severity: 'high'
        });
        showError('Você não tem permissão para atualizar cotações');
        return null;
      }

      // Verificar rate limit
      if (!checkRateLimit('update_cotacao', 20, 60000)) {
        console.warn('⚠️ Auto-save: Rate limit atingido');
        return null;
      }

      const sanitizedCotacao = validateAndSanitizeCotacao(cotacao, true); // silent = true
      if (!sanitizedCotacao) return null;

      const result = await updateCotacaoInternacional(id, sanitizedCotacao);
      
      if (result) {
        logSecurityEvent({
          type: 'sensitive_access',
          details: { 
            action: 'update_cotacao', 
            cotacao_id: id,
            success: true 
          },
          severity: 'low'
        });
        showSuccess('Cotação atualizada com sucesso!');
      }
      
      return result;
    } catch (error) {
      const errorDetails = ErrorHandler.capture(error, {
        component: 'useSecureCotacoes',
        action: 'secureUpdateCotacao'
      });
      
      logSecurityEvent({
        type: 'validation_failure',
        details: { error: errorDetails, action: 'update_cotacao', cotacao_id: id },
        severity: 'high'
      });
      
      showError(ErrorHandler.getUserMessage(errorDetails));
      return null;
    }
  }, [updateCotacaoInternacional, validateAndSanitizeCotacao, showError, showSuccess]);

  const secureDeleteCotacao = useCallback(async (id: string) => {
    try {
      // Verificar permissões
      if (!validateUserPermissions(['cotacoes:delete'])) {
        logSecurityEvent({
          type: 'sensitive_access',
          details: { action: 'delete_cotacao', cotacao_id: id, denied: true },
          severity: 'high'
        });
        showError('Você não tem permissão para excluir cotações');
        return false;
      }

      // Verificar rate limit
      if (!checkRateLimit('delete_cotacao', 5, 60000)) { // 5 exclusões por minuto
        showError('Muitas tentativas. Aguarde um momento antes de tentar novamente.');
        return false;
      }

      await deleteCotacaoInternacional(id);
      
      logSecurityEvent({
        type: 'sensitive_access',
        details: { 
          action: 'delete_cotacao', 
          cotacao_id: id,
          success: true 
        },
        severity: 'medium'
      });
      
      showSuccess('Cotação excluída com sucesso!');
      return true;
    } catch (error) {
      const errorDetails = ErrorHandler.capture(error, {
        component: 'useSecureCotacoes',
        action: 'secureDeleteCotacao'
      });
      
      logSecurityEvent({
        type: 'validation_failure',
        details: { error: errorDetails, action: 'delete_cotacao', cotacao_id: id },
        severity: 'high'
      });
      
      showError(ErrorHandler.getUserMessage(errorDetails));
      return false;
    }
  }, [deleteCotacaoInternacional, showError, showSuccess]);

  return {
    secureCreateCotacao,
    secureUpdateCotacao,
    secureDeleteCotacao,
    silentCreateCotacao,
    silentUpdateCotacao,
    validateAndSanitizeCotacao,
    loading
  };
}