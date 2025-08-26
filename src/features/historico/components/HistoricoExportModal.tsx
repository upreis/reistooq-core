import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, FileText, Database, BarChart3 } from 'lucide-react';
import { HistoricoFileService } from '../services/historicoFileService';
import { useToast } from '@/hooks/use-toast';

interface HistoricoExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalRecords: number;
  onExport: (config: ExportConfig) => Promise<void>;
  isLoading?: boolean;
}

interface ExportConfig {
  format: 'xlsx' | 'csv' | 'json';
  template: 'fiscal' | 'commercial' | 'analytics' | 'audit';
  includeExamples: boolean;
  includeFiscalFields: boolean;
  includeTrackingFields: boolean;
  includeAdvancedFinancial: boolean;
  filename?: string;
}

const templates = [
  {
    id: 'fiscal',
    name: 'Relatório Fiscal',
    description: 'Dados para relatórios fiscais e contábeis',
    icon: FileText,
    fields: ['CPF/CNPJ', 'NCM', 'Valores', 'Endereço', 'Impostos']
  },
  {
    id: 'commercial',
    name: 'Relatório Comercial',
    description: 'Dados comerciais e de vendas',
    icon: BarChart3,
    fields: ['Cliente', 'Produtos', 'Vendas', 'Status', 'Pagamentos']
  },
  {
    id: 'analytics',
    name: 'Relatório Analytics',
    description: 'Dados para análise e métricas',
    icon: Database,
    fields: ['Métricas', 'Performance', 'Tendências', 'Mapeamento']
  },
  {
    id: 'audit',
    name: 'Relatório de Auditoria',
    description: 'Dados completos para auditoria',
    icon: FileSpreadsheet,
    fields: ['Todos os campos', 'Metadados', 'Timestamps', 'Rastreamento']
  }
];

const formatOptions = [
  { value: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet },
  { value: 'csv', label: 'CSV (.csv)', icon: FileText },
  { value: 'json', label: 'JSON (.json)', icon: Database }
];

export function HistoricoExportModal({ 
  open, 
  onOpenChange, 
  totalRecords, 
  onExport, 
  isLoading = false 
}: HistoricoExportModalProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<ExportConfig>({
    format: 'xlsx',
    template: 'commercial',
    includeExamples: false,
    includeFiscalFields: true,
    includeTrackingFields: true,
    includeAdvancedFinancial: false
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting || isLoading) return;
    
    try {
      setIsExporting(true);
      
      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `historico-${config.template}-${timestamp}.${config.format}`;
      
      await onExport({ ...config, filename });
      
      toast({
        title: "Exportação iniciada",
        description: `Preparando arquivo ${filename}...`
      });
      
    } catch (error: any) {
      toast({
        title: "Erro na exportação",
        description: error.message || "Não foi possível exportar os dados",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === config.template);
  const selectedFormat = formatOptions.find(f => f.value === config.format);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Histórico de Vendas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {totalRecords.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              registros disponíveis para exportação
            </div>
          </div>

          {/* Template Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de Relatório</Label>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((template) => {
                const Icon = template.icon;
                const isSelected = config.template === template.id;
                
                return (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-muted-foreground/50'
                    }`}
                    onClick={() => setConfig(prev => ({ ...prev, template: template.id as any }))}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        {isSelected && <Badge variant="secondary">Selecionado</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {template.description}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.fields.slice(0, 3).map(field => (
                            <Badge key={field} variant="outline" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                          {template.fields.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.fields.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Formato do Arquivo</Label>
            <Select 
              value={config.format} 
              onValueChange={(value: any) => setConfig(prev => ({ ...prev, format: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o formato" />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Opções de Exportação</Label>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Incluir campos fiscais</Label>
                  <div className="text-xs text-muted-foreground">
                    CPF/CNPJ, NCM, códigos de barras, impostos
                  </div>
                </div>
                <Switch
                  checked={config.includeFiscalFields}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, includeFiscalFields: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Incluir campos de rastreamento</Label>
                  <div className="text-xs text-muted-foreground">
                    Códigos de rastreamento, URLs, datas, envio
                  </div>
                </div>
                <Switch
                  checked={config.includeTrackingFields}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, includeTrackingFields: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Incluir campos financeiros avançados</Label>
                  <div className="text-xs text-muted-foreground">
                    Taxas, comissões, valores líquidos, métodos pagamento
                  </div>
                </div>
                <Switch
                  checked={config.includeAdvancedFinancial}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, includeAdvancedFinancial: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Incluir dados de exemplo</Label>
                  <div className="text-xs text-muted-foreground">
                    Adiciona linhas de exemplo no arquivo template
                  </div>
                </div>
                <Switch
                  checked={config.includeExamples}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, includeExamples: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {selectedTemplate && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Resumo da Exportação</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="space-y-1">
                  <div><strong>Tipo:</strong> {selectedTemplate.name}</div>
                  <div><strong>Formato:</strong> {selectedFormat?.label}</div>
                  <div><strong>Registros:</strong> {totalRecords.toLocaleString()}</div>
                  <div><strong>Campos fiscais:</strong> {config.includeFiscalFields ? 'Incluídos' : 'Não incluídos'}</div>
                  <div><strong>Rastreamento:</strong> {config.includeTrackingFields ? 'Incluído' : 'Não incluído'}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isExporting || isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleExport}
              disabled={isExporting || isLoading || totalRecords === 0}
              className="gap-2"
            >
              {isExporting || isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Exportar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}