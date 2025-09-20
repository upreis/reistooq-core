import { toast } from 'sonner';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Tipos de notificação com ícones e estilos consistentes
export const notifications = {
  success: (message: string, options?: NotificationOptions) => {
    return toast.success(options?.title || message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined
    });
  },

  error: (message: string, options?: NotificationOptions) => {
    return toast.error(options?.title || message, {
      description: options?.description,
      duration: options?.duration || 6000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined
    });
  },

  warning: (message: string, options?: NotificationOptions) => {
    return toast.warning(options?.title || message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined
    });
  },

  info: (message: string, options?: NotificationOptions) => {
    return toast.info(options?.title || message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined
    });
  },

  loading: (message: string, options?: { description?: string }) => {
    return toast.loading(message, {
      description: options?.description
    });
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  }
};

// Notificações específicas para ações comuns
export const actionNotifications = {
  // Operações CRUD
  created: (item: string) => notifications.success(`${item} criado com sucesso!`),
  updated: (item: string) => notifications.success(`${item} atualizado com sucesso!`),
  deleted: (item: string) => notifications.success(`${item} removido com sucesso!`),
  
  // Operações de dados
  saved: () => notifications.success('Dados salvos com sucesso!'),
  imported: (count: number, item: string) => 
    notifications.success(`${count} ${item}(s) importado(s) com sucesso!`),
  exported: (item: string) => notifications.success(`${item} exportado com sucesso!`),
  
  // Integrações
  connected: (service: string) => 
    notifications.success(`Conectado com ${service}!`, {
      description: 'A sincronização será iniciada automaticamente.'
    }),
  disconnected: (service: string) => 
    notifications.info(`Desconectado do ${service}`),
  syncing: (service: string) => 
    notifications.loading(`Sincronizando com ${service}...`),
  synced: (service: string, count?: number) => 
    notifications.success(`Sincronização com ${service} concluída!`, {
      description: count ? `${count} itens sincronizados` : undefined
    }),
  
  // Erros comuns
  networkError: () => 
    notifications.error('Erro de conexão', {
      description: 'Verifique sua internet e tente novamente.',
      action: {
        label: 'Tentar Novamente',
        onClick: () => window.location.reload()
      }
    }),
  
  permissionError: () => 
    notifications.error('Acesso negado', {
      description: 'Você não tem permissão para esta ação.'
    }),
  
  validationError: (field: string) => 
    notifications.error('Dados inválidos', {
      description: `Verifique o campo: ${field}`
    }),

  // Operações em lote
  bulkSuccess: (count: number, action: string, item: string) =>
    notifications.success(`${count} ${item}(s) ${action} com sucesso!`),
  
  bulkPartialSuccess: (success: number, total: number, action: string, item: string) =>
    notifications.warning(`${success} de ${total} ${item}(s) ${action}`, {
      description: 'Alguns itens não puderam ser processados.'
    }),

  // Sistema
  maintenanceMode: () =>
    notifications.info('Sistema em manutenção', {
      description: 'Algumas funcionalidades podem estar indisponíveis.',
      duration: 8000
    }),

  updateAvailable: () =>
    notifications.info('Nova versão disponível', {
      description: 'Recarregue a página para atualizar.',
      action: {
        label: 'Atualizar',
        onClick: () => window.location.reload()
      }
    })
};

// Hook para usar notificações em componentes
export const useNotifications = () => {
  return {
    ...notifications,
    ...actionNotifications,
    dismiss: (toastId: string | number) => toast.dismiss(toastId),
    dismissAll: () => toast.dismiss()
  };
};