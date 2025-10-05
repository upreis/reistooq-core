import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VendasExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendas: any[];
  analytics: any;
}

export function VendasExportModal({ open, onOpenChange, vendas, analytics }: VendasExportModalProps) {
  const { toast } = useToast();
  const [exportConfig, setExportConfig] = useState({
    format: 'xlsx',
    includeData: true,
    includeCharts: false,
    includeMap: false,
    columns: {
      basicas: true,
      cliente: true,
      produto: true,
      valores: true,
      localizacao: true,
      rastreamento: false,
      observacoes: false
    },
    filters: {
      aplicarFiltrosAtuais: true,
      incluirResumo: true
    }
  });
  
  const [isExporting, setIsExporting] = useState(false);
  
  const formatOptions = [
    { value: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet, description: 'Planilha completa com formatação' },
    { value: 'csv', label: 'CSV (.csv)', icon: FileText, description: 'Dados tabulares simples' }
  ];
  
  const columnGroups = [
    {
      key: 'basicas',
      label: 'Informações Básicas',
      description: 'Data, número do pedido, status',
      columns: ['data_pedido', 'numero_pedido', 'status', 'empresa']
    },
    {
      key: 'cliente',
      label: 'Dados do Cliente',
      description: 'Nome, documento, localização',
      columns: ['cliente_nome', 'cpf_cnpj', 'cidade', 'uf']
    },
    {
      key: 'produto',
      label: 'Produto',
      description: 'SKU, descrição, quantidade',
      columns: ['sku_produto', 'descricao', 'quantidade']
    },
    {
      key: 'valores',
      label: 'Valores',
      description: 'Preços, frete, descontos',
      columns: ['valor_unitario', 'valor_total', 'valor_frete', 'valor_desconto']
    },
    {
      key: 'localizacao',
      label: 'Localização',
      description: 'Cidade, estado, região',
      columns: ['cidade', 'uf']
    },
    {
      key: 'rastreamento',
      label: 'Rastreamento',
      description: 'Códigos de rastreamento, URLs',
      columns: ['codigo_rastreamento', 'url_rastreamento']
    },
    {
      key: 'observacoes',
      label: 'Observações',
      description: 'Comentários e observações',
      columns: ['observacoes', 'obs_interna']
    }
  ];
  
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `vendas-dashboard-${timestamp}.${exportConfig.format}`;
      
      toast({
        title: "Exportação concluída",
        description: `Arquivo ${filename} foi gerado com sucesso!`
      });
      
      onOpenChange(false);
      
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar o arquivo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const selectedColumnsCount = Object.values(exportConfig.columns).filter(Boolean).length;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Dashboard de Vendas
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{vendas.length.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Registros</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {analytics?.geografico?.estados?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Estados</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {new Set(vendas.map(v => v.empresa)).size}
                  </div>
                  <div className="text-sm text-muted-foreground">Canais</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-3">
            <Label className="text-base font-semibold">Formato do Arquivo</Label>
            <RadioGroup
              value={exportConfig.format}
              onValueChange={(value) => setExportConfig(prev => ({ ...prev, format: value }))}
            >
              {formatOptions.map(option => (
                <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <option.icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      {option.description}
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Colunas dos Dados</Label>
              <Badge variant="outline">{selectedColumnsCount} selecionadas</Badge>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {columnGroups.map(group => (
                <div key={group.key} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={group.key}
                    checked={exportConfig.columns[group.key as keyof typeof exportConfig.columns]}
                    onCheckedChange={(checked) => 
                      setExportConfig(prev => ({
                        ...prev,
                        columns: { ...prev.columns, [group.key]: checked }
                      }))
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor={group.key} className="font-medium cursor-pointer">
                      {group.label}
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      {group.description}
                    </div>
                  </div>
                  <Badge variant="outline">{group.columns.length} campos</Badge>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {exportConfig.includeData && `${vendas.length.toLocaleString()} registros serão exportados`}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isExporting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting || vendas.length === 0}
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
