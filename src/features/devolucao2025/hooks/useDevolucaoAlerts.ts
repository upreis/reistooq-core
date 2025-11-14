/**
 * 🚨 HOOK PARA DETECTAR ALERTAS EM DEVOLUÇÕES
 * Detecta prazos próximos, atrasos e mediações
 */

import { useMemo } from 'react';
import { differenceInHours, isPast } from 'date-fns';
import { calculateAnalysisDeadline } from '../utils/businessDays';

export interface DevolucaoAlert {
  id: string;
  order_id: string;
  claim_id: string;
  type: 'prazo_proximo' | 'atrasado' | 'mediador_atribuido';
  priority: 'alta' | 'media' | 'baixa';
  title: string;
  message: string;
  horasRestantes?: number;
  deadline?: Date;
}

export const useDevolucaoAlerts = (devolucoes: any[]) => {
  const alerts = useMemo(() => {
    const detectedAlerts: DevolucaoAlert[] = [];

    devolucoes.forEach((dev) => {
      const now = new Date();

      // 1. VERIFICAR PRAZO DE ANÁLISE (3 dias úteis após chegada)
      if (dev.data_chegada_produto) {
        try {
          const deadline = calculateAnalysisDeadline(dev.data_chegada_produto);
          
          if (deadline) {
            const hoursRemaining = differenceInHours(deadline, now);

            // PRAZO PRÓXIMO (menos de 24h)
            if (hoursRemaining > 0 && hoursRemaining <= 24) {
              detectedAlerts.push({
                id: `prazo-${dev.id}`,
                order_id: dev.order_id,
                claim_id: dev.claim_id,
                type: 'prazo_proximo',
                priority: hoursRemaining <= 6 ? 'alta' : 'media',
                title: `⏰ Prazo de análise se aproximando - Pedido ${dev.order_id}`,
                message: `Faltam ${hoursRemaining}h para analisar a devolução. Ação necessária urgente!`,
                horasRestantes: hoursRemaining,
                deadline
              });
            }

            // ATRASO NA ANÁLISE
            if (isPast(deadline) && dev.status_devolucao !== 'closed') {
              const hoursLate = Math.abs(differenceInHours(now, deadline));
              detectedAlerts.push({
                id: `atraso-${dev.id}`,
                order_id: dev.order_id,
                claim_id: dev.claim_id,
                type: 'atrasado',
                priority: 'alta',
                title: `🚨 ANÁLISE ATRASADA - Pedido ${dev.order_id}`,
                message: `Prazo de análise vencido há ${hoursLate}h. Ação imediata necessária!`,
                horasRestantes: -hoursLate,
                deadline
              });
            }
          }
        } catch (error) {
          console.error('Erro ao processar prazo de análise:', error);
        }
      }

      // 2. VERIFICAR MEDIADOR ATRIBUÍDO
      if (dev.em_mediacao && !dev.mediacao_notificada) {
        detectedAlerts.push({
          id: `mediacao-${dev.id}`,
          order_id: dev.order_id,
          claim_id: dev.claim_id,
          type: 'mediador_atribuido',
          priority: 'alta',
          title: `⚖️ Mediação iniciada - Pedido ${dev.order_id}`,
          message: `Um mediador foi atribuído. Prepare toda documentação necessária.`
        });
      }
    });

    // Ordenar por prioridade (alta > media > baixa)
    return detectedAlerts.sort((a, b) => {
      const priorityOrder = { alta: 0, media: 1, baixa: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [devolucoes]);

  return {
    alerts,
    totalAlerts: alerts.length,
    alertsByType: {
      prazo_proximo: alerts.filter(a => a.type === 'prazo_proximo').length,
      atrasado: alerts.filter(a => a.type === 'atrasado').length,
      mediador_atribuido: alerts.filter(a => a.type === 'mediador_atribuido').length
    }
  };
};
