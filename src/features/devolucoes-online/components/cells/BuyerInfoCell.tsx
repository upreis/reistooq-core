/**
 * 👤 BUYER INFO CELL - FASE 1
 * Exibe dados do comprador na tabela de devoluções
 */

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, User, Mail, Phone, Calendar } from 'lucide-react';
import type { BuyerInfo } from '../../types/devolucao.types';
import { EmptyFieldIndicator } from '../EmptyFieldIndicator';
import { getEmptyFieldInfo } from '../../utils/emptyFieldDetector';

interface BuyerInfoCellProps {
  buyerInfo?: BuyerInfo | null;
  rawData?: any; // Dados brutos para análise
}

export const BuyerInfoCell = memo<BuyerInfoCellProps>(({ buyerInfo, rawData }) => {
  // Se não temos dados do comprador
  if (!buyerInfo) {
    const analysis = getEmptyFieldInfo('comprador_nome', null, rawData || {});
    
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <User className="w-3 h-3" />
        <EmptyFieldIndicator analysis={analysis} fieldName="Comprador" />
      </div>
    );
  }

  // Nome completo ou nickname
  const displayName = buyerInfo.first_name && buyerInfo.last_name
    ? `${buyerInfo.first_name} ${buyerInfo.last_name}`
    : buyerInfo.nickname;

  // Telefone formatado
  const phoneFormatted = buyerInfo.phone?.area_code && buyerInfo.phone?.number
    ? `(${buyerInfo.phone.area_code}) ${buyerInfo.phone.number}`
    : null;

  // Tags de reputação
  const reputationTags = buyerInfo.buyer_reputation?.tags || [];
  const hasGoodReputation = reputationTags.some(tag => 
    tag.includes('good') || tag.includes('excellent')
  );
  const hasBadReputation = reputationTags.some(tag => 
    tag.includes('bad') || tag.includes('poor')
  );

  return (
    <div className="space-y-1.5 min-w-[180px]">
      {/* Nome e Nickname */}
      <div className="flex items-start gap-2">
        <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate" title={displayName}>
            {displayName}
          </div>
          {buyerInfo.first_name && buyerInfo.last_name && (
            <div className="text-xs text-muted-foreground truncate" title={buyerInfo.nickname}>
              @{buyerInfo.nickname}
            </div>
          )}
        </div>
      </div>

      {/* Email (se disponível) */}
      {buyerInfo.email ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="w-3 h-3 flex-shrink-0" />
          <span className="truncate" title={buyerInfo.email}>
            {buyerInfo.email}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="w-3 h-3 flex-shrink-0" />
          <EmptyFieldIndicator 
            analysis={getEmptyFieldInfo('comprador_email', null, rawData || {})} 
            fieldName="Email"
          />
        </div>
      )}

      {/* Telefone (se disponível) */}
      {phoneFormatted && (
        <div className="flex items-center gap-2 text-xs">
          <Phone className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
          <span className="font-mono">{phoneFormatted}</span>
          {buyerInfo.phone?.verified && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              ✓
            </Badge>
          )}
        </div>
      )}

      {/* Data de registro */}
      {buyerInfo.registration_date && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3 flex-shrink-0" />
          <span>
            Desde {new Date(buyerInfo.registration_date).getFullYear()}
          </span>
        </div>
      )}

      {/* Reputação */}
      {reputationTags.length > 0 && (
        <div className="flex items-center gap-1">
          <Badge 
            variant={hasGoodReputation ? 'default' : hasBadReputation ? 'destructive' : 'outline'}
            className="text-[10px] px-1.5 py-0"
          >
            {hasGoodReputation && '⭐ Boa'}
            {hasBadReputation && '⚠️ Atenção'}
            {!hasGoodReputation && !hasBadReputation && '👤 Normal'}
          </Badge>
        </div>
      )}

      {/* Link para perfil ML */}
      {buyerInfo.permalink && (
        <a
          href={buyerInfo.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Ver perfil ML</span>
        </a>
      )}
    </div>
  );
});

BuyerInfoCell.displayName = 'BuyerInfoCell';
