/**
 * 👤 BUYER INFO CELL
 * Exibe informações do comprador com avatar/iniciais
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { User } from 'lucide-react';

interface BuyerInfo {
  id?: number;
  nickname?: string;
  first_name?: string;
  last_name?: string;
}

interface BuyerInfoCellProps {
  buyerInfo?: BuyerInfo | null;
  buyerFullName?: string | null;
  buyerNickname?: string | null;
  buyerCpf?: string | null;
}

export function BuyerInfoCell({ 
  buyerInfo, 
  buyerFullName,
  buyerNickname,
  buyerCpf 
}: BuyerInfoCellProps) {
  // Priorizar dados estruturados do buyerInfo
  const displayName = buyerInfo?.first_name || buyerFullName || buyerNickname || 'Comprador';
  const nickname = buyerInfo?.nickname || buyerNickname;
  const buyerId = buyerInfo?.id;
  
  // Gerar iniciais para avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(displayName);

  if (!displayName && !nickname) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <User className="h-4 w-4" />
        <span className="text-sm">Comprador não identificado</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-start gap-3 min-w-[200px]">
            {/* Avatar com iniciais */}
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-border">
              <span className="text-sm font-semibold text-primary">
                {initials}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Nome Principal */}
              <div className="flex items-start gap-1.5 mb-1">
                <span className="text-sm font-medium line-clamp-2 flex-1">
                  {displayName}
                </span>
              </div>

              {/* Nickname + CPF */}
              <div className="flex items-center gap-2 flex-wrap">
                {nickname && (
                  <Badge variant="secondary" className="text-xs">
                    @{nickname}
                  </Badge>
                )}
                {buyerCpf && (
                  <span className="text-xs text-muted-foreground">
                    CPF: {buyerCpf}
                  </span>
                )}
              </div>

              {/* ID do comprador */}
              {buyerId && (
                <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                  ID: {buyerId}
                </div>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-sm">
          <div className="space-y-2">
            <p className="font-semibold">{displayName}</p>
            {nickname && (
              <p className="text-xs">Nickname: @{nickname}</p>
            )}
            {buyerId && (
              <p className="text-xs text-muted-foreground font-mono">
                ID do Comprador: {buyerId}
              </p>
            )}
            {buyerCpf && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs">CPF:</span>
                <span className="text-xs font-medium">{buyerCpf}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
