// P3.4: Análise e otimização de bundle - identificar dependências não utilizadas
import React from 'react';
import { toast } from 'react-hot-toast';

// Função para lazy loading de componentes grandes
export const lazyComponentLoader = (importFn: () => Promise<any>) => {
  return React.lazy(() => 
    importFn().catch(error => {
      console.error('Erro ao carregar componente:', error);
      toast.error('Erro ao carregar componente');
      // Retorna componente de fallback
      return { default: () => React.createElement('div', null, 'Erro ao carregar') };
    })
  );
};

// Otimização de imports - mapear imports específicos em vez de barrel exports
export const optimizeImports = {
  // Em vez de: import { Button, Badge, Card } from '@/components/ui';
  // Usar: imports específicos para cada componente
  button: () => import('@/components/ui/button').then(m => ({ Button: m.Button })),
  badge: () => import('@/components/ui/badge').then(m => ({ Badge: m.Badge })),
  card: () => import('@/components/ui/card').then(m => ({ Card: m.Card })),
};

// Detectar dependências não utilizadas (para análise manual)
export const analyzeUnusedDependencies = () => {
  const potentiallyUnused = [
    '@tanstack/react-virtual', // Verificar se é usado
    'recharts', // Verificar se gráficos são necessários
    'framer-motion', // Verificar animações
    'embla-carousel-react', // Verificar carrosséis
    '@zxing/browser', // Scanner de código de barras
    'input-otp', // OTP inputs
    'react-day-picker', // Date picker
    'react-resizable-panels', // Painéis redimensionáveis
    'vaul', // Drawer component
  ];
  
  console.log('🔍 [BUNDLE] Dependências para verificar uso:', potentiallyUnused);
  
  // Retornar para análise manual
  return potentiallyUnused;
};

// Code splitting por rota
export const routeLazyLoading = {
  Pedidos: () => import('@/pages/Pedidos'),
  Historico: () => import('@/pages/Historico'),
  // Produtos: () => import('@/pages/Produtos'), // Comentado - página não existe
  // Integracoes: () => import('@/pages/Integracoes'), // Comentado - página não existe  
  // Analytics: () => import('@/pages/Analytics'), // Comentado - página não existe
};

// Tree shaking helpers
export const treeShakingOptimizations = {
  // Usar imports específicos do date-fns
  dateUtils: {
    format: () => import('date-fns/format'),
    parseISO: () => import('date-fns/parseISO'),
    subDays: () => import('date-fns/subDays'),
  },
  
  // Usar imports específicos do lodash (se usado) - comentado pois lodash não está instalado
  // lodashUtils: {
  //   debounce: () => import('lodash/debounce'),
  //   groupBy: () => import('lodash/groupBy'),
  //   sortBy: () => import('lodash/sortBy'),
  // },
};