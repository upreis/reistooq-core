// ⚡ Widget de Ações Rápidas
// Botões para funcionalidades mais utilizadas

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Package, ShoppingCart, FileText, 
  BarChart3, Download, Upload, Settings,
  Scan, Calculator, Users, Bell
} from "lucide-react";
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path?: string;
  action?: () => void;
  badge?: string;
  color: 'primary' | 'success' | 'warning' | 'secondary';
}

export function QuickActionsWidget() {
  const navigate = useNavigate();

  const quickActions: QuickAction[] = [
    {
      id: 'add-product',
      title: 'Novo Produto',
      description: 'Cadastrar produto',
      icon: Plus,
      path: '/estoque/novo',
      color: 'primary'
    },
    {
      id: 'scan-product',
      title: 'Scanner',
      description: 'Escanear código',
      icon: Scan,
      path: '/scanner',
      badge: 'Rápido',
      color: 'success'
    },
    {
      id: 'manage-orders',
      title: 'Pedidos',
      description: 'Gerenciar pedidos',
      icon: ShoppingCart,
      path: '/pedidos',
      badge: '12 novos',
      color: 'warning'
    },
    {
      id: 'generate-report',
      title: 'Relatórios',
      description: 'Gerar relatório',
      icon: FileText,
      path: '/analytics',
      color: 'secondary'
    },
    {
      id: 'import-data',
      title: 'Importar',
      description: 'Importar dados',
      icon: Upload,
      action: () => console.log('Import action'),
      color: 'primary'
    },
    {
      id: 'export-data',
      title: 'Exportar',
      description: 'Exportar dados',
      icon: Download,
      action: () => console.log('Export action'),
      color: 'secondary'
    }
  ];

  const handleActionClick = (action: QuickAction) => {
    if (action.path) {
      navigate(action.path);
    } else if (action.action) {
      action.action();
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'success':
        return 'hover:bg-success/10 border-success/20';
      case 'warning':
        return 'hover:bg-warning/10 border-warning/20';
      case 'secondary':
        return 'hover:bg-secondary/10 border-secondary/20';
      default:
        return 'hover:bg-primary/10 border-primary/20';
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case 'success': return 'text-success';
      case 'warning': return 'text-warning';
      case 'secondary': return 'text-secondary';
      default: return 'text-primary';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={`
                  relative p-3 rounded-lg border border-border text-left
                  transition-all duration-200 group
                  ${getColorClasses(action.color)}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-md bg-muted/50 ${getIconColor(action.color)}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm truncate">{action.title}</h4>
                      {action.badge && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>

                {/* Indicador de hover */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>

        {/* Seção de estatísticas rápidas */}
        <div className="mt-6 pt-4 border-t border-border">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Status Rápido
          </h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Produtos:</span>
              <span className="font-medium">1.247</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Alertas:</span>
              <span className="font-medium text-warning">8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pedidos:</span>
              <span className="font-medium">34</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Online:</span>
              <span className="font-medium text-success">5</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}