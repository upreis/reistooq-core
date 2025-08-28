import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  type: 'discount' | 'approval' | 'stock' | 'shipping' | 'notification';
  conditions: any;
  actions: any;
  enabled: boolean;
  created_at: string;
}

export function useOMSAutomation() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock automation rules - in real app would come from database
  const mockRules: AutomationRule[] = [
    {
      id: '1',
      name: 'Auto-aprovação VIP',
      description: 'Aprovar automaticamente pedidos de clientes VIP até R$ 5.000',
      type: 'approval',
      conditions: { customerType: 'VIP', maxValue: 5000 },
      actions: { autoApprove: true, priority: 'high' },
      enabled: true,
      created_at: new Date().toISOString()
    },
    {
      id: '2', 
      name: 'Desconto Black Friday',
      description: 'Aplicar 20% desconto em pedidos acima de R$ 500 em novembro',
      type: 'discount',
      conditions: { month: 11, minValue: 500 },
      actions: { discountPercent: 20 },
      enabled: false,
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Alerta Estoque Crítico',
      description: 'Notificar quando estoque for menor que 10 unidades',
      type: 'notification',
      conditions: { stockLevel: 10 },
      actions: { notifyEmail: true, notifyPush: true },
      enabled: true,
      created_at: new Date().toISOString()
    }
  ];

  useEffect(() => {
    setRules(mockRules);
  }, []);

  const toggleRule = async (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, enabled: !rule.enabled }
        : rule
    ));
  };

  const executeAutomations = async (triggerType: string, data: any) => {
    const applicableRules = rules.filter(rule => 
      rule.enabled && rule.type === triggerType
    );
    
    // Simulate automation execution
    console.log('Executing automations:', applicableRules, data);
    
    return applicableRules;
  };

  return {
    rules,
    loading,
    toggleRule,
    executeAutomations
  };
}