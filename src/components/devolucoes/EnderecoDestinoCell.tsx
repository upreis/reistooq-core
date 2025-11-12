/**
 * 📍 CÉLULA DE ENDEREÇO DE DESTINO DA DEVOLUÇÃO
 * Mostra endereço completo em tooltip (rua, cidade, estado, CEP)
 */

import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EnderecoDestinoCellProps {
  endereco_destino_devolucao?: string | null;
  rua_destino?: string | null;
  numero_destino?: string | null;
  cidade_destino?: string | null;
  estado_destino?: string | null;
  cep_destino?: string | null;
  bairro_destino?: string | null;
}

export const EnderecoDestinoCell = ({
  endereco_destino_devolucao,
  rua_destino,
  numero_destino,
  cidade_destino,
  estado_destino,
  cep_destino,
  bairro_destino
}: EnderecoDestinoCellProps) => {
  
  // Se não houver dados, exibir vazio
  if (!endereco_destino_devolucao && !cidade_destino && !cep_destino) {
    return <span className="text-muted-foreground">-</span>;
  }

  // Construir resumo (cidade, UF)
  const resumo = [cidade_destino, estado_destino].filter(Boolean).join(', ') || 'Endereço';

  // Construir endereço completo para tooltip
  const enderecoCompleto = [
    rua_destino && numero_destino ? `${rua_destino}, ${numero_destino}` : rua_destino || endereco_destino_devolucao,
    bairro_destino,
    cidade_destino && estado_destino ? `${cidade_destino} - ${estado_destino}` : cidade_destino,
    cep_destino ? `CEP: ${cep_destino}` : null
  ].filter(Boolean).join('\n');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-1.5 cursor-pointer hover:bg-accent">
            <MapPin className="h-3 w-3" />
            <span className="max-w-[120px] truncate">{resumo}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="text-sm whitespace-pre-line font-mono">
            {enderecoCompleto}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
