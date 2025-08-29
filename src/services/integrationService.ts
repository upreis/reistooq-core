import { LogisticEvent } from '@/types/logistics';

export interface TrackingInfo {
  code: string;
  status: string;
  location: string;
  timestamp: string;
  description: string;
  carrier: string;
}

export interface ExternalSystemAlert {
  id: string;
  message: string;
  kind: 'info' | 'warning' | 'error' | 'success';
  href?: string;
  link_label?: string;
  target_routes?: string[];
  priority?: number;
  auto_dismiss?: boolean;
  created_at: string;
}

class IntegrationService {
  private baseUrl = process.env.VITE_API_URL || 'https://api.example.com';
  
  // Simulação de API de rastreamento
  async getTrackingInfo(trackingCode: string): Promise<TrackingInfo | null> {
    try {
      // Em produção, chamar API real de rastreamento (Correios, transportadoras, etc.)
      
      // Simulação com dados realistas
      const mockStatuses = [
        { status: 'Objeto postado', location: 'São Paulo - SP' },
        { status: 'Em trânsito', location: 'Centro de Distribuição - SP' },
        { status: 'Saiu para entrega', location: 'Agência de destino' },
        { status: 'Entregue', location: 'Endereço do destinatário' }
      ];
      
      const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];
      
      await new Promise(resolve => setTimeout(resolve, 800)); // Simular latência
      
      return {
        code: trackingCode,
        status: randomStatus.status,
        location: randomStatus.location,
        timestamp: new Date().toISOString(),
        description: `Pacote ${trackingCode} - ${randomStatus.status}`,
        carrier: 'Transportadora Express'
      };
    } catch (error) {
      console.error('Erro ao consultar rastreamento:', error);
      return null;
    }
  }

  // Integração com sistema de avisos
  async sendSystemAlert(alert: Omit<ExternalSystemAlert, 'id' | 'created_at'>): Promise<boolean> {
    try {
      const alertData: ExternalSystemAlert = {
        ...alert,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      };

      // Em produção, enviar para API do sistema de avisos
      // await fetch(`${this.baseUrl}/alerts`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(alertData)
      // });

      // Por enquanto, usar localStorage como cache e disparar evento personalizado
      const existingAlerts = this.getStoredAlerts();
      existingAlerts.push(alertData);
      localStorage.setItem('system_alerts', JSON.stringify(existingAlerts));

      // Disparar evento personalizado para notificar componentes
      window.dispatchEvent(new CustomEvent('newSystemAlert', { 
        detail: alertData 
      }));

      return true;
    } catch (error) {
      console.error('Erro ao enviar alerta do sistema:', error);
      return false;
    }
  }

  // Obter alertas armazenados
  getStoredAlerts(): ExternalSystemAlert[] {
    try {
      const stored = localStorage.getItem('system_alerts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Limpar alertas antigos
  clearOldAlerts(): void {
    const alerts = this.getStoredAlerts();
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const recentAlerts = alerts.filter(alert => 
      new Date(alert.created_at) > oneWeekAgo
    );
    
    localStorage.setItem('system_alerts', JSON.stringify(recentAlerts));
  }

  // Sincronizar eventos com sistema externo
  async syncEvents(events: LogisticEvent[]): Promise<boolean> {
    try {
      // Em produção, sincronizar com ERP, WMS, etc.
      console.log('Sincronizando eventos com sistema externo:', events.length);
      
      // Simular sincronização
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Erro na sincronização:', error);
      return false;
    }
  }

  // Obter atualizações de status de transportadoras
  async getCarrierUpdates(): Promise<{ trackingCode: string; newStatus: string }[]> {
    try {
      // Em produção, consultar APIs de múltiplas transportadoras
      
      // Simulação de atualizações
      const mockUpdates = [
        { trackingCode: 'BR123456789', newStatus: 'Em trânsito' },
        { trackingCode: 'BR987654321', newStatus: 'Entregue' }
      ];
      
      return mockUpdates.filter(() => Math.random() > 0.7); // Simular atualizações ocasionais
    } catch (error) {
      console.error('Erro ao obter atualizações:', error);
      return [];
    }
  }

  // Validar dados de evento com fontes externas
  async validateEventData(event: Partial<LogisticEvent>): Promise<{
    valid: boolean;
    suggestions?: string[];
    warnings?: string[];
  }> {
    try {
      const suggestions: string[] = [];
      const warnings: string[] = [];

      // Validação de CEP/endereço
      if (event.location) {
        const hasValidFormat = /\d{5}-?\d{3}/.test(event.location);
        if (!hasValidFormat) {
          suggestions.push('Adicione o CEP para melhor rastreamento');
        }
      }

      // Validação de horário comercial
      if (event.time && event.type === 'delivery') {
        const hour = parseInt(event.time.split(':')[0]);
        if (hour < 8 || hour > 18) {
          warnings.push('Horário fora do expediente comercial padrão');
        }
      }

      // Validação de código de rastreamento
      if (event.tracking_code) {
        const isValidFormat = /^[A-Z]{2}\d{9}$/.test(event.tracking_code);
        if (!isValidFormat) {
          warnings.push('Formato de código de rastreamento pode estar incorreto');
        }
      }

      return {
        valid: warnings.length === 0,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      console.error('Erro na validação:', error);
      return { valid: true };
    }
  }
}

export const integrationService = new IntegrationService();