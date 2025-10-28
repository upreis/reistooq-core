import { HighlightConfig } from "../types/devolucao-analise.types";

/**
 * Calcula quantos dias se passaram desde uma data
 */
export function calcularDiasDesdeAtualizacao(data: string | null): number {
  if (!data) return 999; // Sem data = muito tempo
  
  const dataAtualizacao = new Date(data);
  const agora = new Date();
  const diffMs = agora.getTime() - dataAtualizacao.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDias;
}

/**
 * Retorna a configuração de highlight baseada nos dias
 */
export function getHighlightConfig(diasDesdeAtualizacao: number): HighlightConfig | null {
  // Menos de 1 dia (24h) - Verde intenso
  if (diasDesdeAtualizacao === 0) {
    return {
      rowClass: 'bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500',
      fieldClass: 'bg-green-100 dark:bg-green-900/30 font-semibold text-green-700 dark:text-green-300',
      label: 'Atualizado hoje',
      dias: 0
    };
  }
  
  // 1-2 dias - Verde claro
  if (diasDesdeAtualizacao <= 2) {
    return {
      rowClass: 'bg-green-50/50 dark:bg-green-950/10 border-l-2 border-green-400',
      fieldClass: 'bg-green-50 dark:bg-green-900/20 font-medium text-green-600 dark:text-green-400',
      label: 'Atualizado recentemente',
      dias: diasDesdeAtualizacao
    };
  }
  
  // 3-5 dias - Amarelo
  if (diasDesdeAtualizacao <= 5) {
    return {
      rowClass: 'bg-yellow-50/50 dark:bg-yellow-950/10 border-l-2 border-yellow-400',
      fieldClass: 'bg-yellow-50 dark:bg-yellow-900/20 font-medium text-yellow-600 dark:text-yellow-400',
      label: 'Atualizado há alguns dias',
      dias: diasDesdeAtualizacao
    };
  }
  
  // Mais de 5 dias - sem highlight
  return null;
}

/**
 * Formata a data de atualização para exibição
 */
export function formatarDataAtualizacao(data: string | null): string {
  if (!data) return 'Nunca';
  
  const dataObj = new Date(data);
  const agora = new Date();
  const diffMs = agora.getTime() - dataObj.getTime();
  const diffMinutos = Math.floor(diffMs / (1000 * 60));
  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutos < 60) {
    return `Há ${diffMinutos} min`;
  }
  
  if (diffHoras < 24) {
    return `Há ${diffHoras}h`;
  }
  
  if (diffDias === 1) {
    return 'Ontem';
  }
  
  if (diffDias < 7) {
    return `Há ${diffDias} dias`;
  }
  
  return dataObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Verifica se um campo específico foi atualizado recentemente
 */
export function foiCampoAtualizado(
  camposAtualizados: any[] | null,
  nomeCampo: string,
  diasLimite: number = 5
): boolean {
  if (!camposAtualizados || !Array.isArray(camposAtualizados)) return false;
  
  return camposAtualizados.some(campo => {
    if (campo.campo !== nomeCampo) return false;
    const dias = calcularDiasDesdeAtualizacao(campo.data_mudanca);
    return dias <= diasLimite;
  });
}
