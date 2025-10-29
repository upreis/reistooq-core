/**
 * ⚠️ ALERTA DE CICLO DE VIDA
 * Mostra avisos sobre reclamações próximas da exclusão
 */

import { useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Info, XCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { gerarRelatorioExclusao } from '../utils/reclamacaoLifecycle';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

interface ReclamacoesLifecycleAlertProps {
  reclamacoes: any[];
  onExportarEmRisco?: () => void;
}

export function ReclamacoesLifecycleAlert({ 
  reclamacoes,
  onExportarEmRisco 
}: ReclamacoesLifecycleAlertProps) {
  const relatorio = useMemo(() => 
    gerarRelatorioExclusao(reclamacoes),
    [reclamacoes]
  );
  
  if (relatorio.totalEmRisco === 0) {
    return null;
  }
  
  return (
    <div className="space-y-3">
      {/* Alerta Crítico - Serão Excluídas */}
      {relatorio.seraExcluidas.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">
            {relatorio.seraExcluidas.length} reclamações serão excluídas automaticamente
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>
              Estas reclamações atingiram o limite de tempo sem análise e serão 
              removidas na próxima limpeza automática.
            </p>
            {onExportarEmRisco && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onExportarEmRisco}
                className="mt-2"
              >
                Exportar dados antes da exclusão
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Alerta Urgente */}
      {relatorio.urgentes.length > 0 && (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900 dark:text-orange-100">
            {relatorio.urgentes.length} reclamações em estado URGENTE
          </AlertTitle>
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            Restam poucos dias para análise destas reclamações. 
            Faça a análise urgentemente para evitar exclusão automática.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Alerta Atenção */}
      {relatorio.emAtencao.length > 0 && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-900 dark:text-yellow-100">
            {relatorio.emAtencao.length} reclamações precisam de atenção
          </AlertTitle>
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            Estas reclamações estão se aproximando do limite de tempo. 
            Planeje fazer a análise em breve.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Resumo Geral */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Resumo do Ciclo de Vida</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <strong>Total em risco:</strong> {relatorio.totalEmRisco} reclamações
            </div>
            <div>
              <strong>Valor total:</strong> {formatCurrency(relatorio.valorTotalEmRisco)}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Reclamações em mediação ou com valores acima de R$ 500 são protegidas 
            contra exclusão automática.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
