/**
 * 🎯 SELETOR DE STATUS DE ANÁLISE
 * Componente para alterar status de análise das devoluções
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle, DollarSign, AlertCircle, XCircle } from 'lucide-react';
import { StatusAnalise, STATUS_ANALISE_LABELS } from '../types/devolucao-analise.types';

interface StatusAnaliseSelectProps {
  value: StatusAnalise;
  onChange: (newStatus: StatusAnalise) => void;
}

export function StatusAnaliseSelect({ value, onChange }: StatusAnaliseSelectProps) {
  const getIcon = (status: StatusAnalise) => {
    const className = "h-3.5 w-3.5";
    switch (status) {
      case 'pendente':
        return <Clock className={`${className} text-yellow-500`} />;
      case 'em_analise':
        return <AlertCircle className={`${className} text-blue-500`} />;
      case 'aguardando_ml':
        return <Clock className={`${className} text-orange-500`} />;
      case 'resolvido_sem_dinheiro':
        return <CheckCircle className={`${className} text-green-500`} />;
      case 'resolvido_com_dinheiro':
        return <DollarSign className={`${className} text-emerald-500`} />;
      case 'cancelado':
        return <XCircle className={`${className} text-gray-500`} />;
      default:
        return <Clock className={className} />;
    }
  };

  const getVariant = (status: StatusAnalise) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20';
      case 'em_analise':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20';
      case 'aguardando_ml':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20';
      case 'resolvido_sem_dinheiro':
        return 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20';
      case 'resolvido_com_dinheiro':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20';
      case 'cancelado':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20 hover:bg-gray-500/20';
      default:
        return '';
    }
  };

  return (
    <Select value={value} onValueChange={(v) => onChange(v as StatusAnalise)}>
      <SelectTrigger className={`h-9 w-[160px] ${getVariant(value)}`}>
        <div className="flex items-center gap-2">
          {getIcon(value)}
          <span className="text-xs font-medium">{STATUS_ANALISE_LABELS[value]}</span>
        </div>
      </SelectTrigger>
      <SelectContent className="bg-background">
        {Object.entries(STATUS_ANALISE_LABELS).map(([key, label]) => (
          <SelectItem key={key} value={key}>
            <div className="flex items-center gap-2">
              {getIcon(key as StatusAnalise)}
              <span className="text-sm">{label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
