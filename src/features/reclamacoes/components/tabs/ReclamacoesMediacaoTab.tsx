/**
 * ⚖️ ABA MEDIAÇÃO - Informações sobre mediação
 * FASE 3: Estrutura básica (será implementada completamente na FASE 4)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale } from 'lucide-react';

interface ReclamacoesMediacaoTabProps {
  claimId: string;
}

export function ReclamacoesMediacaoTab({ claimId }: ReclamacoesMediacaoTabProps) {
  return (
    <div className="text-center py-12">
      <Scale className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
      <h3 className="text-lg font-semibold mb-2">Mediação</h3>
      <p className="text-sm text-muted-foreground">
        Detalhes de mediação serão implementados na FASE 4
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        Claim ID: {claimId}
      </p>
    </div>
  );
}
