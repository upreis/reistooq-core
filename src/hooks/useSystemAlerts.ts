import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { performHealthCheck, HealthStatus } from '@/utils/health-check';
import { useNotifications } from '@/utils/notifications';
import { logger } from '@/utils/logger';

interface AlertRule {
  id: string;
  name: string;
  condition: (status: HealthStatus) => boolean;
  message: string;
  severity: 'info' | 'warning' | 'error';
  cooldown: number; // minutes
}

const alertRules: AlertRule[] = [
  {
    id: 'system_down',
    name: 'Sistema Inativo',
    condition: (status) => status.status === 'down',
    message: 'Sistema com problemas críticos detectados',
    severity: 'error',
    cooldown: 5
  },
  {
    id: 'system_degraded',
    name: 'Sistema Degradado',
    condition: (status) => status.status === 'degraded',
    message: 'Sistema funcionando com limitações',
    severity: 'warning',
    cooldown: 15
  },
  {
    id: 'supabase_down',
    name: 'Supabase Indisponível',
    condition: (status) => status.checks.supabase.status === 'fail',
    message: 'Problemas de conectividade com banco de dados',
    severity: 'error',
    cooldown: 5
  },
  {
    id: 'apis_down',
    name: 'APIs Externas Indisponíveis',
    condition: (status) => status.checks.apis.status === 'fail',
    message: 'APIs externas não estão respondendo',
    severity: 'error',
    cooldown: 10
  },
  {
    id: 'high_memory',
    name: 'Alto Uso de Memória',
    condition: (status) => status.performance.memoryUsage > 500,
    message: 'Uso de memória acima do normal',
    severity: 'warning',
    cooldown: 30
  },
  {
    id: 'high_error_rate',
    name: 'Alta Taxa de Erros',
    condition: (status) => status.performance.errorRate > 10,
    message: 'Taxa de erros acima do aceitável',
    severity: 'warning',
    cooldown: 15
  },
  {
    id: 'slow_apis',
    name: 'APIs Lentas',
    condition: (status) => status.performance.apiLatency > 3000,
    message: 'APIs respondendo lentamente',
    severity: 'warning',
    cooldown: 20
  },
  {
    id: 'integrations_stale',
    name: 'Integrações Desatualizadas',
    condition: (status) => status.checks.integrations.status === 'warn',
    message: 'Algumas integrações precisam ser sincronizadas',
    severity: 'info',
    cooldown: 60
  }
];

export const useSystemAlerts = (enabled: boolean = true) => {
  const notifications = useNotifications();
  const alertCooldowns = useRef(new Map<string, number>());
  
  const { data: healthStatus } = useQuery({
    queryKey: ['system-health'],
    queryFn: performHealthCheck,
    refetchInterval: enabled ? 60000 : false, // 1 minute
    enabled
  });

  useEffect(() => {
    if (!enabled || !healthStatus) return;

    checkAlerts(healthStatus);
  }, [healthStatus, enabled]);

  const checkAlerts = (status: HealthStatus) => {
    const now = Date.now();

    for (const rule of alertRules) {
      const lastAlert = alertCooldowns.current.get(rule.id) || 0;
      const cooldownMs = rule.cooldown * 60 * 1000;

      // Skip if still in cooldown
      if (now - lastAlert < cooldownMs) {
        continue;
      }

      // Check if condition is met
      if (rule.condition(status)) {
        triggerAlert(rule, status);
        alertCooldowns.current.set(rule.id, now);
      }
    }
  };

  const triggerAlert = (rule: AlertRule, status: HealthStatus) => {
    logger.warn(`System alert triggered: ${rule.name}`, {
      ruleId: rule.id,
      severity: rule.severity,
      systemStatus: status.status
    });

    switch (rule.severity) {
      case 'error':
        notifications.error(rule.message, {
          title: rule.name,
          duration: 8000,
          action: {
            label: 'Ver Detalhes',
            onClick: () => {
              // Navigate to system dashboard
              window.location.hash = '#system-dashboard';
            }
          }
        });
        break;

      case 'warning':
        notifications.warning(rule.message, {
          title: rule.name,
          duration: 6000
        });
        break;

      case 'info':
        notifications.info(rule.message, {
          title: rule.name,
          duration: 4000
        });
        break;
    }
  };

  const testAlert = (ruleId: string) => {
    const rule = alertRules.find(r => r.id === ruleId);
    if (rule && healthStatus) {
      triggerAlert(rule, healthStatus);
    }
  };

  const clearCooldown = (ruleId: string) => {
    alertCooldowns.current.delete(ruleId);
  };

  const clearAllCooldowns = () => {
    alertCooldowns.current.clear();
  };

  return {
    alertRules,
    testAlert,
    clearCooldown,
    clearAllCooldowns,
    activeCooldowns: Array.from(alertCooldowns.current.entries())
  };
};