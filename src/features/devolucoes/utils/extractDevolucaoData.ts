/**
 * 🔍 UTILITIES PARA EXTRAÇÃO DE DADOS DE DEVOLUÇÕES
 * Funções reutilizáveis para extrair informações de objetos de devolução
 */

import { DevolucaoAvancada } from '../types/devolucao-avancada.types';

/**
 * Extrai o motivo do cancelamento de forma segura
 */
export function extractCancelReason(devolucao: DevolucaoAvancada): string {
  try {
    // Buscar descrição detalhada em dados_claim
    if (devolucao.dados_claim) {
      const claim = devolucao.dados_claim;
      
      if (claim.reason?.description) return String(claim.reason.description);
      if (claim.resolution?.description) return String(claim.resolution.description);
      if (claim.cancel_detail?.description) return String(claim.cancel_detail.description);
      if (claim.cancellation_description) return String(claim.cancellation_description);
      if (claim.reason_description) return String(claim.reason_description);
      if (claim.description) return String(claim.description);
      
      if (claim.reason) return String(claim.reason);
      if (claim.cancel_reason) return String(claim.cancel_reason);
      if (claim.cancellation_reason) return String(claim.cancellation_reason);
      if (claim.resolution?.reason) return String(claim.resolution.reason);
    }
    
    // Buscar em dados_order
    if (devolucao.dados_order) {
      const order = devolucao.dados_order;
      
      if (order.cancel_detail?.description) return String(order.cancel_detail.description);
      if (order.cancellation_description) return String(order.cancellation_description);
      if (order.cancel_description) return String(order.cancel_description);
      
      if (order.cancel_reason) return String(order.cancel_reason);
      if (order.cancellation_reason) return String(order.cancellation_reason);
    }
    
    // Buscar em dados_return
    if (devolucao.dados_return) {
      const returnData = devolucao.dados_return;
      
      if (returnData.reason_description) return String(returnData.reason_description);
      if (returnData.description) return String(returnData.description);
      if (returnData.reason) return String(returnData.reason);
      if (returnData.cancel_reason) return String(returnData.cancel_reason);
    }

    if (devolucao.status_devolucao === 'cancelled') {
      return 'Cancelado - motivo não especificado';
    }
    
    return 'N/A';
  } catch (error) {
    console.error('Erro ao extrair motivo:', error);
    return 'N/A';
  }
}

/**
 * Extrai texto detalhado do motivo
 */
export function extractDetailedReason(devolucao: DevolucaoAvancada): string {
  try {
    if (devolucao.dados_claim) {
      const claim = devolucao.dados_claim;
      if (claim.reason_description) return String(claim.reason_description);
      if (claim.resolution?.description) return String(claim.resolution.description);
      if (claim.resolution?.comments) return String(claim.resolution.comments);
      if (claim.reason_detail) return String(claim.reason_detail);
      if (claim.description) return String(claim.description);
      if (claim.comments) return String(claim.comments);
      if (claim.explanation) return String(claim.explanation);
    }
    
    if (devolucao.dados_return) {
      const returnData = devolucao.dados_return;
      if (returnData.reason_description) return String(returnData.reason_description);
      if (returnData.description) return String(returnData.description);
      if (returnData.comments) return String(returnData.comments);
      if (returnData.explanation) return String(returnData.explanation);
      if (returnData.details) return String(returnData.details);
    }

    if (devolucao.dados_order) {
      const order = devolucao.dados_order;
      if (order.cancel_description) return String(order.cancel_description);
      if (order.cancellation_description) return String(order.cancellation_description);
      if (order.cancel_detail) return String(order.cancel_detail);
      if (order.comments) return String(order.comments);
    }

    if (devolucao.dados_mensagens && Array.isArray(devolucao.dados_mensagens) && devolucao.dados_mensagens.length > 0) {
      const ultimaMensagem = devolucao.dados_mensagens[devolucao.dados_mensagens.length - 1];
      if (ultimaMensagem?.text) return String(ultimaMensagem.text);
      if (ultimaMensagem?.message) return String(ultimaMensagem.message);
    }
    
    return 'Sem detalhes disponíveis';
  } catch (error) {
    console.error('Erro ao extrair texto detalhado:', error);
    return 'Sem detalhes disponíveis';
  }
}

/**
 * Extrai mensagens de texto das conversas
 */
export function extractMessageText(devolucao: DevolucaoAvancada): string {
  try {
    const mensagens: string[] = [];
    
    // Buscar em dados_mensagens.messages
    if (devolucao.dados_mensagens?.messages && Array.isArray(devolucao.dados_mensagens.messages)) {
      for (const msg of devolucao.dados_mensagens.messages) {
        if (msg?.text) {
          const remetente = msg.sender || msg.from || 'Não identificado';
          mensagens.push(`[${String(remetente)}]: ${String(msg.text).substring(0, 100)}...`);
        }
      }
    }
    
    // Buscar em dados_claim.messages
    if (mensagens.length === 0 && devolucao.dados_claim?.messages && Array.isArray(devolucao.dados_claim.messages)) {
      for (const msg of devolucao.dados_claim.messages) {
        if (msg?.text) {
          const remetente = msg.sender || msg.from || 'Não identificado';
          mensagens.push(`[${String(remetente)}]: ${String(msg.text).substring(0, 100)}...`);
        }
      }
    }
    
    // Buscar em dados_return.messages
    if (mensagens.length === 0 && devolucao.dados_return?.messages && Array.isArray(devolucao.dados_return.messages)) {
      for (const msg of devolucao.dados_return.messages) {
        if (msg?.text) {
          const remetente = msg.sender || msg.from || 'Não identificado';
          mensagens.push(`[${String(remetente)}]: ${String(msg.text).substring(0, 100)}...`);
        }
      }
    }
    
    return mensagens.length > 0 ? mensagens.join(' | ') : 'Sem mensagens de texto';
  } catch (error) {
    console.error('Erro ao extrair mensagens:', error);
    return 'Erro ao carregar mensagens';
  }
}

/**
 * Extrai última mensagem de texto
 */
export function extractLastMessageText(devolucao: DevolucaoAvancada): string {
  try {
    const messages = devolucao.dados_mensagens?.messages;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return 'Sem texto da última mensagem';
    }
    
    const ultimaMensagem = messages[messages.length - 1];
    if (ultimaMensagem?.text) {
      return String(ultimaMensagem.text).substring(0, 200);
    }
    
    return 'Sem texto da última mensagem';
  } catch (error) {
    console.error('Erro ao extrair última mensagem:', error);
    return 'Erro ao carregar última mensagem';
  }
}

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number | undefined | null): string {
  if (!value || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

/**
 * Formata data
 */
export function formatDate(date: string | undefined | null): string {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
}
