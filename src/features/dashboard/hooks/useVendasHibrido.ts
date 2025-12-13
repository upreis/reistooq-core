/**
 * Hook híbrido para buscar vendas de forma inteligente.
 * Por enquanto, este hook está preparado mas NÃO ALTERA o comportamento atual.
 * Os componentes continuam usando vendas_hoje_realtime diretamente.
 * 
 * Quando os dados agregados estiverem populados (após alguns dias de CRON),
 * podemos ativar o uso deste hook nos componentes.
 */

import { differenceInDays } from "date-fns";

// Limite de dias para usar dados detalhados vs agregados
const LIMITE_DIAS_REALTIME = 60;

/**
 * Verifica se o período está dentro do limite para usar dados realtime
 */
export function shouldUseRealtime(startDate: Date, endDate: Date): boolean {
  const diasDiferenca = differenceInDays(endDate, startDate);
  return diasDiferenca <= LIMITE_DIAS_REALTIME;
}

/**
 * Retorna informação sobre qual source seria usado
 */
export function getDataSource(startDate: Date, endDate: Date): 'realtime' | 'agregado' {
  return shouldUseRealtime(startDate, endDate) ? 'realtime' : 'agregado';
}

// Tipos exportados para uso futuro
export interface VendaAgregadaProduto {
  data: string;
  integration_account_id: string;
  sku: string | null;
  titulo: string | null;
  thumbnail: string | null;
  quantidade_vendida: number;
  receita: number;
}

export interface VendaAgregadaTotal {
  data: string;
  integration_account_id: string;
  total_receita: number;
  total_pedidos: number;
  ticket_medio: number;
}
