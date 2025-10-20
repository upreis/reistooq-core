/**
 * 📊 CARDS DE ESTATÍSTICAS DE DEVOLUÇÕES
 * Componente modular para exibir estatísticas
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Clock, CheckCircle, XCircle, Wrench } from 'lucide-react';

interface DevolucaoStats {
  total: number;
  pendentes: number;
  concluidas: number;
  canceladas: number;
  totalLoaded: number;
  visible: number;
}

interface PerformanceSettings {
  enableLazyLoading: boolean;
}

interface DevolucaoStatsCardsProps {
  stats: DevolucaoStats;
  performanceSettings: PerformanceSettings;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  bgColor: string;
  iconColor: string;
  subtext?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  label, 
  value, 
  bgColor, 
  iconColor,
  subtext 
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center space-x-2">
        <div className={`p-2 ${bgColor} rounded-lg`}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
          <p className="text-2xl font-bold dark:text-white">{value}</p>
          {subtext && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{subtext}</p>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

export const DevolucaoStatsCards: React.FC<DevolucaoStatsCardsProps> = ({ 
  stats, 
  performanceSettings 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <StatCard
        icon={<Package className="h-4 w-4" />}
        label="Total"
        value={stats.total}
        bgColor="bg-blue-100 dark:bg-blue-900/30"
        iconColor="text-blue-600 dark:text-blue-400"
        subtext={performanceSettings.enableLazyLoading ? `${stats.visible} visíveis` : undefined}
      />
      
      <StatCard
        icon={<Clock className="h-4 w-4" />}
        label="Pendentes"
        value={stats.pendentes}
        bgColor="bg-yellow-100 dark:bg-yellow-900/30"
        iconColor="text-yellow-600 dark:text-yellow-400"
      />
      
      <StatCard
        icon={<CheckCircle className="h-4 w-4" />}
        label="Concluídas"
        value={stats.concluidas}
        bgColor="bg-green-100 dark:bg-green-900/30"
        iconColor="text-green-600 dark:text-green-400"
      />
      
      <StatCard
        icon={<XCircle className="h-4 w-4" />}
        label="Canceladas"
        value={stats.canceladas}
        bgColor="bg-red-100 dark:bg-red-900/30"
        iconColor="text-red-600 dark:text-red-400"
      />
      
      <StatCard
        icon={<Wrench className="h-4 w-4" />}
        label="API ML"
        value={stats.totalLoaded}
        bgColor="bg-purple-100 dark:bg-purple-900/30"
        iconColor="text-purple-600 dark:text-purple-400"
        subtext="Dados em tempo real"
      />
    </div>
  );
};
