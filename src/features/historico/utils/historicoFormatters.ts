// Formatadores de dados para o histórico
import { HISTORICO_CONSTANTS } from './historicoConstants';

// Exportar funções individuais para compatibilidade
export const formatCurrency = (value: number): string => HistoricoFormatters.currency(value);
export const formatNumber = (value: number): string => HistoricoFormatters.number(value);
export const formatPercent = (value: number): string => HistoricoFormatters.percentage(value);
export const formatDateTime = (value: string): string => HistoricoFormatters.datetime(value);

export class HistoricoFormatters {
  // Formatação de moeda
  static currency(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) {
      return 'R$ 0,00';
    }
    
    return new Intl.NumberFormat(HISTORICO_CONSTANTS.LOCALE.LANGUAGE, {
      style: 'currency',
      currency: HISTORICO_CONSTANTS.LOCALE.CURRENCY,
      minimumFractionDigits: HISTORICO_CONSTANTS.VALIDATION.CURRENCY_DECIMALS,
      maximumFractionDigits: HISTORICO_CONSTANTS.VALIDATION.CURRENCY_DECIMALS
    }).format(value);
  }

  // Formatação de número
  static number(value: number | null | undefined, decimals = 0): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
    
    return new Intl.NumberFormat(HISTORICO_CONSTANTS.LOCALE.LANGUAGE, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  // Formatação de percentual
  static percentage(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0%';
    }
    
    return new Intl.NumberFormat(HISTORICO_CONSTANTS.LOCALE.LANGUAGE, {
      style: 'percent',
      minimumFractionDigits: HISTORICO_CONSTANTS.VALIDATION.PERCENTAGE_DECIMALS,
      maximumFractionDigits: HISTORICO_CONSTANTS.VALIDATION.PERCENTAGE_DECIMALS
    }).format(value / 100);
  }

  // Formatação de data
  static date(date: string | Date | null | undefined): string {
    if (!date) return '-';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    return new Intl.DateTimeFormat(HISTORICO_CONSTANTS.LOCALE.LANGUAGE, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(d);
  }

  // Formatação de data e hora
  static datetime(date: string | Date | null | undefined): string {
    if (!date) return '-';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    return new Intl.DateTimeFormat(HISTORICO_CONSTANTS.LOCALE.LANGUAGE, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  }

  // Formatação de data relativa
  static relativeDate(date: string | Date | null | undefined): string {
    if (!date) return '-';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
    return `${Math.floor(diffDays / 365)} anos atrás`;
  }

  // Formatação de tamanho de arquivo
  static fileSize(bytes: number | null | undefined): string {
    if (!bytes || bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    
    return `${size.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
  }

  // Formatação de duração
  static duration(milliseconds: number | null | undefined): string {
    if (!milliseconds || milliseconds === 0) return '0s';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Formatação de status
  static status(status: string | null | undefined): { 
    label: string; 
    color: string; 
    variant: 'default' | 'secondary' | 'destructive' | 'outline' 
  } {
    if (!status) {
      return { label: 'Indefinido', color: '#6b7280', variant: 'outline' };
    }
    
    const statusConfig = HISTORICO_CONSTANTS.STATUS_OPTIONS.find(
      s => s.value === status.toLowerCase()
    );
    
    if (statusConfig) {
      let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
      
      switch (status.toLowerCase()) {
        case 'cancelada':
        case 'devolvida':
          variant = 'destructive';
          break;
        case 'concluida':
          variant = 'default';
          break;
        case 'pendente':
          variant = 'secondary';
          break;
        default:
          variant = 'outline';
      }
      
      return {
        label: statusConfig.label,
        color: statusConfig.color,
        variant
      };
    }
    
    return { 
      label: status, 
      color: '#6b7280',
      variant: 'outline'
    };
  }

  // Formatação de texto truncado
  static truncate(text: string | null | undefined, maxLength = 50): string {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength - 3)}...`;
  }

  // Formatação de CPF/CNPJ
  static document(doc: string | null | undefined): string {
    if (!doc) return '-';
    
    const numbers = doc.replace(/\D/g, '');
    
    if (numbers.length === 11) {
      // CPF
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (numbers.length === 14) {
      // CNPJ
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return doc;
  }

  // Formatação de telefone
  static phone(phone: string | null | undefined): string {
    if (!phone) return '-';
    
    const numbers = phone.replace(/\D/g, '');
    
    if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
  }

  // Formatação de URL
  static url(url: string | null | undefined): { display: string; href?: string } {
    if (!url) return { display: '-' };
    
    try {
      const urlObj = new URL(url);
      return {
        display: urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : ''),
        href: url
      };
    } catch {
      return { display: url, href: url.startsWith('http') ? url : `https://${url}` };
    }
  }

  // Formatação de lista de tags
  static tags(tags: string[] | null | undefined): string[] {
    if (!tags || !Array.isArray(tags)) return [];
    return tags.filter(Boolean).map(tag => tag.trim());
  }

  // Formatação de progresso
  static progress(current: number, total: number): {
    percentage: number;
    display: string;
    variant: 'default' | 'destructive' | 'secondary';
  } {
    if (total === 0) {
      return { percentage: 0, display: '0%', variant: 'secondary' };
    }
    
    const percentage = Math.round((current / total) * 100);
    let variant: 'default' | 'destructive' | 'secondary' = 'default';
    
    if (percentage < 30) variant = 'destructive';
    else if (percentage < 70) variant = 'secondary';
    
    return {
      percentage,
      display: `${percentage}%`,
      variant
    };
  }

  // Formatação de coordenadas geográficas
  static coordinates(lat: number | null, lng: number | null): string {
    if (lat === null || lng === null) return '-';
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  // Formatação de código de rastreamento
  static trackingCode(code: string | null | undefined): {
    formatted: string;
    carrier?: string;
    trackingUrl?: string;
  } {
    if (!code) return { formatted: '-' };
    
    const formatted = code.toUpperCase().trim();
    
    // Detectar transportadora pelo padrão do código
    if (/^[A-Z]{2}\d{9}BR$/.test(formatted)) {
      return {
        formatted,
        carrier: 'Correios',
        trackingUrl: `https://www2.correios.com.br/sistemas/rastreamento/ctrl/ctrlRastreamento.cfm?codigo=${formatted}`
      };
    }
    
    return { formatted };
  }

  // Formatação de variação percentual
  static percentageChange(current: number, previous: number): {
    value: number;
    formatted: string;
    trend: 'up' | 'down' | 'neutral';
    color: string;
  } {
    if (previous === 0) {
      return {
        value: current > 0 ? 100 : 0,
        formatted: current > 0 ? '+100%' : '0%',
        trend: current > 0 ? 'up' : 'neutral',
        color: current > 0 ? '#10b981' : '#6b7280'
      };
    }
    
    const change = ((current - previous) / previous) * 100;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
    const color = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280';
    
    return {
      value: change,
      formatted: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
      trend,
      color
    };
  }
}