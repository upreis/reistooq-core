/**
 * 🎨 BADGE DE LOCAL DE ESTOQUE COM PREVIEW DE SALDO
 * Mostra o local de estoque e a quantidade disponível em tooltip
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { buscarEstoquesTodosLocais, type EstoquePorLocal } from '@/services/EstoquePorLocalService';

interface LocalEstoqueBadgeProps {
  localNome: string;
  localId?: string;
  sku?: string;
  className?: string;
}

export function LocalEstoqueBadge({ localNome, localId, sku, className }: LocalEstoqueBadgeProps) {
  const [estoques, setEstoques] = useState<EstoquePorLocal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sku && localId) {
      setLoading(true);
      buscarEstoquesTodosLocais(sku)
        .then(dados => {
          setEstoques(dados);
        })
        .finally(() => setLoading(false));
    }
  }, [sku, localId]);

  // Encontrar o estoque do local específico
  const estoqueLocal = estoques.find(e => e.local_id === localId);

  // 🎨 Sistema de cores DISTINTAS para cada local de estoque
  const getLocalEstoqueColor = (nome: string): string => {
    const nomeUpper = nome.toUpperCase();
    
    // Cores BEM DIFERENTES por local
    if (nomeUpper.includes('FULL PLATINUM')) {
      return 'bg-purple-500 text-white dark:bg-purple-600 dark:text-white border-purple-600';
    } else if (nomeUpper.includes('ESTOQUE PRINCIPAL') || nomeUpper.includes('PRINCIPAL')) {
      return 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white border-blue-600';
    } else if (nomeUpper.includes('FLEX')) {
      return 'bg-green-500 text-white dark:bg-green-600 dark:text-white border-green-600';
    } else if (nomeUpper.includes('CROSSDOCKING') || nomeUpper.includes('CROSS')) {
      return 'bg-orange-500 text-white dark:bg-orange-600 dark:text-white border-orange-600';
    } else if (nomeUpper.includes('SECUNDÁRIO') || nomeUpper.includes('SECUNDARIO')) {
      return 'bg-indigo-500 text-white dark:bg-indigo-600 dark:text-white border-indigo-600';
    } else if (nomeUpper.includes('RESERVA')) {
      return 'bg-yellow-500 text-gray-900 dark:bg-yellow-600 dark:text-gray-900 border-yellow-600';
    } else {
      // Hash para gerar cores VIBRANTES e consistentes
      const hash = nome.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const colors = [
        'bg-teal-500 text-white dark:bg-teal-600 dark:text-white border-teal-600',
        'bg-pink-500 text-white dark:bg-pink-600 dark:text-white border-pink-600',
        'bg-rose-500 text-white dark:bg-rose-600 dark:text-white border-rose-600',
        'bg-cyan-500 text-white dark:bg-cyan-600 dark:text-white border-cyan-600',
      ];
      return colors[hash % colors.length];
    }
  };

  if (!sku || !localId || loading) {
    return (
      <Badge variant="outline" className={`${getLocalEstoqueColor(localNome)} ${className || ''}`}>
        {localNome}
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${getLocalEstoqueColor(localNome)} cursor-help ${className || ''}`}>
            <Package className="h-3 w-3 mr-1" />
            {localNome}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{localNome}</p>
            {estoqueLocal ? (
              <p className="text-sm">
                Saldo disponível: <span className="font-bold">{estoqueLocal.quantidade}</span> unidades
              </p>
            ) : (
              <p className="text-sm text-amber-500">Produto não cadastrado neste local</p>
            )}
            
            {estoques.length > 1 && (
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">Outros locais:</p>
                {estoques
                  .filter(e => e.local_id !== localId)
                  .map((e, i) => (
                    <p key={i} className="text-xs">
                      • {e.local_nome}: {e.quantidade} un.
                    </p>
                  ))}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
