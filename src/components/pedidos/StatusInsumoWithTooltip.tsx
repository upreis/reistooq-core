import { useState } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Clock } from 'lucide-react';

interface StatusInsumoProps {
  statusInsumo: string;
  detalhesInsumo?: {
    skusFaltando?: string[];
    detalhes?: string;
  };
  onCadastrarClick?: (skuFaltando: string) => void;
}

export function StatusInsumoWithTooltip({ 
  statusInsumo, 
  detalhesInsumo,
  onCadastrarClick 
}: StatusInsumoProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const getStatusConfig = () => {
    switch (statusInsumo) {
      case 'pronto':
        return {
          icon: CheckCircle,
          label: '🟢 Pronto',
          color: 'text-green-600',
          tooltip: 'Todos os insumos estão disponíveis no estoque',
          clickable: false
        };
      
      case 'sem_mapeamento_insumo':
        return {
          icon: AlertTriangle,
          label: '⚠️ Sem Mapeamento',
          color: 'text-yellow-600',
          tooltip: 'O produto precisa ser mapeado em Estoque > Composições para definir os insumos necessários',
          clickable: false
        };
      
      case 'sem_cadastro_insumo':
        const skuFaltando = detalhesInsumo?.skusFaltando?.[0] || 'Insumo';
        return {
          icon: AlertCircle,
          label: `${skuFaltando} Sem Cadastro`,
          color: 'text-destructive',
          tooltip: `O insumo "${skuFaltando}" precisa ser cadastrado em Estoque > Controle de Estoque. Clique para cadastrar agora.`,
          clickable: true,
          skuFaltando
        };
      
      case 'pendente_insumo':
        return {
          icon: Clock,
          label: '🔴 Sem Estoque',
          color: 'text-orange-600',
          tooltip: 'Os insumos estão cadastrados mas não há quantidade suficiente no estoque. Atualize as quantidades em Estoque > Controle de Estoque.',
          clickable: false
        };
      
      default:
        return {
          icon: AlertCircle,
          label: '—',
          color: 'text-muted-foreground',
          tooltip: 'Status desconhecido',
          clickable: false
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const handleClick = () => {
    if (config.clickable && config.skuFaltando && onCadastrarClick) {
      onCadastrarClick(config.skuFaltando);
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div 
        className={`flex items-center gap-1 ${config.color} ${config.clickable ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
        onClick={handleClick}
        role={config.clickable ? 'button' : undefined}
        tabIndex={config.clickable ? 0 : undefined}
        title={config.tooltip}
      >
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{config.label}</span>
      </div>
      
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground border rounded-md shadow-md max-w-xs">
          <p className="text-sm">{config.tooltip}</p>
          {detalhesInsumo?.detalhes && (
            <p className="text-xs text-muted-foreground mt-1">{detalhesInsumo.detalhes}</p>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover" />
        </div>
      )}
    </div>
  );
}
