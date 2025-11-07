import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, 
  FileText, 
  Building, 
  TrendingUp,
  Package,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Settings
} from "lucide-react";
import { formatMoney } from "@/lib/format";

interface ComprasHeaderProps {
  stats?: {
    pedidos_pendentes?: number;
    cotacoes_abertas?: number;
    fornecedores_ativos?: number;
    valor_total_mes?: number;
  };
}

export const ComprasHeader: React.FC<ComprasHeaderProps> = ({
  stats = {}
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detectar aba ativa baseado na rota atual
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/compras/pedidos')) return 'pedidos';
    if (path.includes('/compras/cotacoes')) return 'cotacoes';
    if (path.includes('/compras/fornecedores')) return 'fornecedores';
    if (path.includes('/compras/importacao')) return 'importacao';
    return 'pedidos';
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tab: string) => {
    navigate(`/compras/${tab}`);
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Compras</h1>
          <p className="text-muted-foreground">
            Gerencie pedidos, cotações e fornecedores de forma integrada
          </p>
        </div>

        {/* Estatísticas Resumidas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Pedidos Pendentes</p>
              <p className="text-lg font-semibold">{stats.pedidos_pendentes || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <FileText className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Cotações Abertas</p>
              <p className="text-lg font-semibold">{stats.cotacoes_abertas || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Building className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Fornecedores</p>
              <p className="text-lg font-semibold">{stats.fornecedores_ativos || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Valor Mês</p>
              <p className="text-lg font-semibold">
                {stats.valor_total_mes ? formatMoney(stats.valor_total_mes) : 'R$ 0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pedidos" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Pedidos de Compra
            {stats.pedidos_pendentes > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.pedidos_pendentes}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="cotacoes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Cotações
          </TabsTrigger>

          <TabsTrigger value="fornecedores" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Fornecedores
          </TabsTrigger>

          <TabsTrigger value="importacao" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Importação
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Alertas e Notificações */}
      <div className="flex flex-wrap gap-2">
        {stats.pedidos_pendentes > 5 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg border border-orange-200">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {stats.pedidos_pendentes} pedidos aguardando aprovação
            </span>
          </div>
        )}


        {stats.valor_total_mes > 50000 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Meta mensal atingida
            </span>
          </div>
        )}
      </div>
    </div>
  );
};