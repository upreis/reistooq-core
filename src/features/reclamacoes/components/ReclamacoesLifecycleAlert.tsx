/**
 * ⚠️ ALERTA DE CICLO DE VIDA
 * Mostra avisos sobre reclamações próximas da exclusão
 */

import React, { useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info, XCircle, Shield, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { gerarRelatorioExclusao } from '../utils/reclamacaoLifecycle';
import * as XLSX from 'xlsx';

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
  const [isOpen, setIsOpen] = useState(false);
  
  const relatorio = useMemo(() => 
    gerarRelatorioExclusao(reclamacoes),
    [reclamacoes]
  );
  
  const handleExportarEmRisco = () => {
    const reclamacoesEmRisco = [
      ...relatorio.seraExcluidas,
      ...relatorio.urgentes,
      ...relatorio.emAtencao
    ];

    if (reclamacoesEmRisco.length === 0) {
      return;
    }

    // Preparar dados para exportação
    const dataToExport = reclamacoesEmRisco.map(rec => ({
      'ID Reclamação': rec.claim_id,
      'Pedido': rec.order_id || '-',
      'Status': rec.status,
      'Tipo': rec.type,
      'Estágio': rec.stage,
      'Status Análise': rec.status_analise || 'pendente',
      'Valor': rec.value ? `R$ ${rec.value.toFixed(2)}` : '-',
      'Data Criação': rec.date_created ? new Date(rec.date_created).toLocaleDateString('pt-BR') : '-',
      'Última Atualização': rec.last_updated ? new Date(rec.last_updated).toLocaleDateString('pt-BR') : '-',
      'Dias sem Análise': rec.diasDesdeAtualizacao || 0,
      'Nível de Risco': rec.diasDesdeAtualizacao >= 60 ? 'CRÍTICO' : 
                        rec.diasDesdeAtualizacao >= 55 ? 'URGENTE' : 'ATENÇÃO',
      'Protegida': (rec.value >= 500 || rec.stage === 'mediation') ? 'Sim' : 'Não',
      'Motivo Proteção': rec.value >= 500 ? 'Valor alto' : 
                         rec.stage === 'mediation' ? 'Em mediação' : '-'
    }));

    // Criar workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 15 }, // ID Reclamação
      { wch: 15 }, // Pedido
      { wch: 12 }, // Status
      { wch: 12 }, // Tipo
      { wch: 12 }, // Estágio
      { wch: 15 }, // Status Análise
      { wch: 12 }, // Valor
      { wch: 15 }, // Data Criação
      { wch: 18 }, // Última Atualização
      { wch: 15 }, // Dias sem Análise
      { wch: 12 }, // Nível de Risco
      { wch: 10 }, // Protegida
      { wch: 15 }, // Motivo Proteção
    ];
    ws['!cols'] = colWidths;

    // Adicionar à workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Reclamações em Risco');

    // Download
    const fileName = `reclamacoes_em_risco_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };
  
  if (relatorio.totalEmRisco === 0) {
    return null;
  }
  
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Alertas
            <Badge variant="destructive" className="text-xs">
              {relatorio.totalEmRisco}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-3">
            {!isOpen && relatorio.totalEmRisco > 0 && (
              <div className="relative">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                </span>
              </div>
            )}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="h-8 w-8 p-0"
              >
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
      </CardHeader>
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportarEmRisco}
              className="mt-2"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar dados antes da exclusão
            </Button>
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
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
