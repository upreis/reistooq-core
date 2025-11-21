import { useState, memo, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusAnalise, STATUS_ANALISE_LABELS } from "../types/devolucao-analise.types";
import { CheckCircle2, Clock, AlertCircle, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusAnaliseSelectProps {
  value: StatusAnalise;
  onChange: (newStatus: StatusAnalise) => void;
  disabled?: boolean;
  className?: string;
  allowedStatuses?: StatusAnalise[]; // ✨ NOVO: Controla quais status podem ser selecionados
}

// Ícones por status
const STATUS_ICONS: Record<StatusAnalise, React.ReactNode> = {
  pendente: <Clock className="h-4 w-4 text-yellow-500" />,
  em_analise: <HelpCircle className="h-4 w-4 text-blue-500" />,
  aguardando_ml: <AlertCircle className="h-4 w-4 text-orange-500" />,
  resolvido_sem_dinheiro: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  resolvido_com_dinheiro: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  cancelado: <XCircle className="h-4 w-4 text-red-500" />,
  foi_para_devolucao: <CheckCircle2 className="h-4 w-4 text-purple-500" />
};

// Classes de cores por status
const STATUS_COLORS: Record<StatusAnalise, string> = {
  pendente: "text-yellow-700 dark:text-yellow-300",
  em_analise: "text-blue-700 dark:text-blue-300",
  aguardando_ml: "text-orange-700 dark:text-orange-300",
  resolvido_sem_dinheiro: "text-green-700 dark:text-green-300",
  resolvido_com_dinheiro: "text-emerald-700 dark:text-emerald-300",
  cancelado: "text-red-700 dark:text-red-300",
  foi_para_devolucao: "text-purple-700 dark:text-purple-300"
};

export const StatusAnaliseSelect = memo(function StatusAnaliseSelect({
  value,
  onChange,
  disabled = false,
  className,
  allowedStatuses // ✨ NOVO: Array de status permitidos
}: StatusAnaliseSelectProps) {
  const [isChanging, setIsChanging] = useState(false);

  const handleValueChange = useCallback(async (newValue: string) => {
    setIsChanging(true);
    try {
      await onChange(newValue as StatusAnalise);
    } finally {
      setIsChanging(false);
    }
  }, [onChange]);

  // Se allowedStatuses não for fornecido, mostra todos
  const availableStatuses = allowedStatuses || Object.keys(STATUS_ANALISE_LABELS) as StatusAnalise[];

  return (
    <Select
      value={value}
      onValueChange={handleValueChange}
      disabled={disabled || isChanging}
    >
      <SelectTrigger 
        className={cn(
          "w-[200px] h-9 gap-2",
          STATUS_COLORS[value],
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-background z-50">
        {availableStatuses.map((statusKey) => (
          <SelectItem
            key={statusKey}
            value={statusKey}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {STATUS_ICONS[statusKey as StatusAnalise]}
              <span>{STATUS_ANALISE_LABELS[statusKey]}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

StatusAnaliseSelect.displayName = 'StatusAnaliseSelect';
