// Seletor de colunas para histórico - baseado nas colunas de pedidos
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Eye, EyeOff } from 'lucide-react';

interface ColumnConfig {
  key: string;
  label: string;
  category: 'basicas' | 'produtos' | 'financeiras' | 'mapeamento' | 'envio';
  visible: boolean;
  width?: number;
}

const defaultColumns: ColumnConfig[] = [
  // === Básicas ===
  { key: 'id_unico', label: 'ID Único', category: 'basicas', visible: true },
  { key: 'empresa', label: 'Empresa', category: 'basicas', visible: true },
  { key: 'numero_pedido', label: 'Número do Pedido', category: 'basicas', visible: true },
  { key: 'nome_cliente', label: 'Nome do Cliente', category: 'basicas', visible: true },
  { key: 'nome_completo', label: 'Nome Completo', category: 'basicas', visible: false },
  { key: 'data_pedido', label: 'Data do Pedido', category: 'basicas', visible: true },
  { key: 'ultima_atualizacao', label: 'Última Atualização', category: 'basicas', visible: false },

  // === Produtos ===
  { key: 'sku_produto', label: 'SKUs/Produtos', category: 'produtos', visible: true },
  { key: 'quantidade_total', label: 'Quantidade Total', category: 'produtos', visible: true },
  { key: 'titulo_produto', label: 'Título do Produto', category: 'produtos', visible: true },

  // === Financeiras ===
  { key: 'valor_total', label: 'Valor Total', category: 'financeiras', visible: true },
  { key: 'valor_pago', label: 'Valor Pago', category: 'financeiras', visible: false },
  { key: 'frete_pago_cliente', label: 'Frete Pago Cliente', category: 'financeiras', visible: false },
  { key: 'receita_flex_bonus', label: 'Receita Flex (Bônus)', category: 'financeiras', visible: false },
  { key: 'custo_envio_seller', label: 'Custo Envio Seller', category: 'financeiras', visible: false },
  { key: 'desconto_cupom', label: 'Desconto Cupom', category: 'financeiras', visible: false },
  { key: 'taxa_marketplace', label: 'Taxa Marketplace', category: 'financeiras', visible: false },
  { key: 'valor_liquido_vendedor', label: 'Valor Líquido Vendedor', category: 'financeiras', visible: false },
  { key: 'metodo_pagamento', label: 'Método Pagamento', category: 'financeiras', visible: false },
  { key: 'status_pagamento', label: 'Status Pagamento', category: 'financeiras', visible: false },
  { key: 'tipo_pagamento', label: 'Tipo Pagamento', category: 'financeiras', visible: false },

  // === Mapeamento ===
  { key: 'status_mapeamento', label: 'Status Mapeamento', category: 'mapeamento', visible: true },
  { key: 'sku_estoque', label: 'SKU Estoque', category: 'mapeamento', visible: true },
  { key: 'sku_kit', label: 'SKU KIT', category: 'mapeamento', visible: true },
  { key: 'quantidade_kit', label: 'Quantidade KIT', category: 'mapeamento', visible: true },
  { key: 'total_itens', label: 'Total de Itens', category: 'mapeamento', visible: true },
  { key: 'status_baixa', label: 'Status da Baixa', category: 'mapeamento', visible: true },

  // === Envio ===
  { key: 'status_envio', label: 'Status do Envio', category: 'envio', visible: false },
  { key: 'logistic_mode', label: 'Logistic Mode (Principal)', category: 'envio', visible: false },
  { key: 'tipo_logistico', label: 'Tipo Logístico', category: 'envio', visible: false },
  { key: 'tipo_metodo_envio', label: 'Tipo Método Envio', category: 'envio', visible: false },
  { key: 'tipo_entrega', label: 'Tipo Entrega', category: 'envio', visible: false },
  { key: 'substatus_estado_atual', label: 'Substatus (Estado Atual)', category: 'envio', visible: false },
  { key: 'modo_envio_combinado', label: 'Modo de Envio (Combinado)', category: 'envio', visible: false },
  { key: 'metodo_envio_combinado', label: 'Método de Envio (Combinado)', category: 'envio', visible: false },
];

const categoryLabels = {
  basicas: 'Básicas',
  produtos: 'Produtos', 
  financeiras: 'Financeiras',
  mapeamento: 'Mapeamento',
  envio: 'Envio'
};

const categoryColors = {
  basicas: 'bg-blue-500',
  produtos: 'bg-green-500',
  financeiras: 'bg-purple-500',
  mapeamento: 'bg-orange-500',
  envio: 'bg-teal-500'
};

interface HistoricoColumnSelectorProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
}

export function HistoricoColumnSelector({ columns, onColumnsChange }: HistoricoColumnSelectorProps) {
  const [tempColumns, setTempColumns] = useState<ColumnConfig[]>(columns);
  const [isOpen, setIsOpen] = useState(false);

  // Sincronizar tempColumns quando as colunas mudarem
  React.useEffect(() => {
    setTempColumns(columns);
  }, [columns]);

  const handleColumnToggle = (columnKey: string, visible: boolean) => {
    setTempColumns(prev => 
      prev.map(col => 
        col.key === columnKey ? { ...col, visible } : col
      )
    );
  };

  const handleSave = () => {
    onColumnsChange(tempColumns);
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempColumns(defaultColumns);
  };

  const visibleCount = tempColumns.filter(col => col.visible).length;
  const totalCount = tempColumns.length;

  const groupedColumns = tempColumns.reduce((acc, column) => {
    if (!acc[column.category]) {
      acc[column.category] = [];
    }
    acc[column.category].push(column);
    return acc;
  }, {} as Record<string, ColumnConfig[]>);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Colunas
          <Badge variant="secondary" className="ml-2">
            {visibleCount}/{totalCount}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Selecionar Colunas</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Padrão
              </Button>
              <Button size="sm" onClick={handleSave}>
                Salvar
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(groupedColumns).map(([category, categoryColumns]) => (
            <Card key={category}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className={`w-3 h-3 rounded-full ${categoryColors[category as keyof typeof categoryColors]}`} />
                  {categoryLabels[category as keyof typeof categoryLabels]}
                  <Badge variant="outline" className="ml-auto">
                    {categoryColumns.filter(col => col.visible).length}/{categoryColumns.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categoryColumns.map((column) => (
                  <div key={column.key} className="flex items-center space-x-3">
                    <Checkbox
                      checked={column.visible}
                      onCheckedChange={(checked) => 
                        handleColumnToggle(column.key, checked as boolean)
                      }
                    />
                    <div className="flex items-center gap-2 flex-1">
                      {column.visible ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={`text-sm ${column.visible ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {column.label}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {visibleCount} de {totalCount} colunas selecionadas
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              Restaurar Padrão
            </Button>
            <Button onClick={handleSave}>
              Aplicar Colunas
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { defaultColumns };
export type { ColumnConfig };