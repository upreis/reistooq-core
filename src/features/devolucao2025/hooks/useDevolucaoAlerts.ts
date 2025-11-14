/**
 * 🚨 HOOK PARA DETECTAR ALERTAS EM DEVOLUÇÕES
 * Detecta prazos próximos, atrasos e mediações
 */

import { useMemo } from 'react';
import { differenceInHours, isPast, parseISO } from 'date-fns';

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

      // 1. VERIFICAR PRAZO PRÓXIMO (menos de 24h)
      if (dev.deadline_date) {
        try {
          const deadline = parseISO(dev.deadline_date);
          const hoursRemaining = differenceInHours(deadline, now);

          if (hoursRemaining > 0 && hoursRemaining <= 24) {
            detectedAlerts.push({
              id: `prazo-${dev.id}`,
              order_id: dev.order_id,
              claim_id: dev.claim_id,
              type: 'prazo_proximo',
              priority: hoursRemaining <= 6 ? 'alta' : 'media',
              title: `⏰ Prazo se aproximando - Pedido ${dev.order_id}`,
              message: `Faltam ${hoursRemaining}h para o prazo limite. Ação necessária urgente!`,
              horasRestantes: hoursRemaining,
              deadline
            });
          }

          // 2. VERIFICAR ATRASO
          if (isPast(deadline) && dev.status_devolucao !== 'closed') {
            const hoursLate = Math.abs(differenceInHours(now, deadline));
            detectedAlerts.push({
              id: `atraso-${dev.id}`,
              order_id: dev.order_id,
              claim_id: dev.claim_id,
              type: 'atrasado',
              priority: 'alta',
              title: `🚨 ATRASADO - Pedido ${dev.order_id}`,
              message: `Prazo vencido há ${hoursLate}h. Ação imediata necessária!`,
              horasRestantes: -hoursLate,
              deadline
            });
          }
        } catch (error) {
          console.error('Erro ao processar deadline:', error);
        }
      }

      // 3. VERIFICAR MEDIADOR ATRIBUÍDO
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
