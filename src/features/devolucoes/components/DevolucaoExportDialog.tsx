/**
 * 🎯 DIALOG PARA EXPORTAÇÃO AVANÇADA DE DEVOLUÇÕES
 * Interface para configurar e executar exportações
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Code, 
  Settings,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { ExportOptions } from '../hooks/useDevolucaoExportacao';

interface DevolucaoExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: 'csv' | 'excel' | 'json', options: ExportOptions) => void;
  onExportFullReport: () => void;
  totalRecords: number;
  filteredRecords: number;
}

const DevolucaoExportDialog: React.FC<DevolucaoExportDialogProps> = ({
  open,
  onOpenChange,
  onExport,
  onExportFullReport,
  totalRecords,
  filteredRecords
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'excel' | 'json'>('excel');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeMessages, setIncludeMessages] = useState(false);
  const [includeAnalytics, setIncludeAnalytics] = useState(false);

  const handleExport = () => {
    const options: ExportOptions = {
      format: selectedFormat,
      includeDetails,
      includeMessages,
      includeAnalytics
    };

    onExport(selectedFormat, options);
    onOpenChange(false);
  };

  const handleFullReport = () => {
    onExportFullReport();
    onOpenChange(false);
  };

  const formatOptions = [
    {
      value: 'excel' as const,
      label: 'Excel (XLSX)',
      description: 'Ideal para análises e relatórios',
      icon: <FileSpreadsheet className="h-5 w-5" />,
      features: ['Múltiplas abas', 'Formatação avançada', 'Gráficos'],
      recommended: true
    },
    {
      value: 'csv' as const,
      label: 'CSV',
      description: 'Compatível com qualquer planilha',
      icon: <FileText className="h-5 w-5" />,
      features: ['Universal', 'Leve', 'Importação fácil'],
      recommended: false
    },
    {
      value: 'json' as const,
      label: 'JSON',
      description: 'Para desenvolvedores e APIs',
      icon: <Code className="h-5 w-5" />,
      features: ['Estruturado', 'Metadados', 'Programático'],
      recommended: false
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Devoluções
          </DialogTitle>
          <DialogDescription>
            Configure as opções de exportação para seus dados de devoluções
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações dos Dados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados a Exportar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Total de registros disponíveis</p>
                  <p className="text-xs text-muted-foreground">
                    Todos os dados carregados no sistema
                  </p>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {totalRecords.toLocaleString()}
                </Badge>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Registros filtrados</p>
                  <p className="text-xs text-muted-foreground">
                    Dados que serão exportados com filtros atuais
                  </p>
                </div>
                <Badge className="text-lg px-3 py-1">
                  {filteredRecords.toLocaleString()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Seleção de Formato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Formato de Exportação</CardTitle>
              <CardDescription>
                Escolha o formato mais adequado para seu uso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as any)}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {formatOptions.map((format) => (
                    <div key={format.value} className="relative">
                      <RadioGroupItem
                        value={format.value}
                        id={format.value}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={format.value}
                        className="flex flex-col space-y-3 p-4 border-2 rounded-lg cursor-pointer peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-muted/50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {format.icon}
                            <span className="font-medium">{format.label}</span>
                          </div>
                          {format.recommended && (
                            <Badge variant="default" className="text-xs">
                              Recomendado
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {format.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-1">
                          {format.features.map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Opções de Conteúdo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Opções de Conteúdo
              </CardTitle>
              <CardDescription>
                Configure quais informações incluir na exportação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="include-details" className="text-sm font-medium">
                    Incluir detalhes completos
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    IDs internos, timestamps, status detalhados
                  </p>
                </div>
                <Switch
                  id="include-details"
                  checked={includeDetails}
                  onCheckedChange={setIncludeDetails}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="include-messages" className="text-sm font-medium">
                    Incluir mensagens e comunicações
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Histórico de mensagens com compradores (quando disponível)
                  </p>
                </div>
                <Switch
                  id="include-messages"
                  checked={includeMessages}
                  onCheckedChange={setIncludeMessages}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="include-analytics" className="text-sm font-medium">
                    Incluir dados analíticos
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Métricas calculadas e insights (apenas Excel)
                  </p>
                </div>
                <Switch
                  id="include-analytics"
                  checked={includeAnalytics && selectedFormat === 'excel'}
                  onCheckedChange={setIncludeAnalytics}
                  disabled={selectedFormat !== 'excel'}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleExport} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Exportar Dados Filtrados
            </Button>
            
            <Button variant="outline" onClick={handleFullReport} className="flex-1">
              <BarChart3 className="h-4 w-4 mr-2" />
              Relatório Completo
            </Button>
          </div>

          {/* Informações Adicionais */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Informações importantes:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Os dados exportados refletem os filtros atualmente aplicados</li>
                    <li>• O relatório completo inclui múltiplas abas com analytics detalhados</li>
                    <li>• Arquivos grandes podem levar alguns segundos para gerar</li>
                    <li>• Os dados são processados localmente no seu navegador</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DevolucaoExportDialog;