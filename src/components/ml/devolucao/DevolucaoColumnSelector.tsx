import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export interface DevolucaoColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  category: 'identification' | 'dates' | 'status' | 'buyer' | 'product' | 'financial' | 'reason' | 'mediation' | 'communication' | 'tracking';
}

export const DEFAULT_DEVOLUCAO_COLUMNS: DevolucaoColumnConfig[] = [
  // IDENTIFICAÇÃO
  { key: 'account_name', label: 'Empresa', visible: true, category: 'identification' },
  { key: 'order_id', label: 'N.º da Venda', visible: true, category: 'identification' },
  { key: 'claim_id', label: 'N.º da Reclamação', visible: true, category: 'identification' },
  { key: 'return_id', label: 'N.º da Devolução', visible: true, category: 'identification' },
  { key: 'sku', label: 'SKU', visible: true, category: 'identification' },
  { key: 'transaction_id', label: 'ID de Pagamento', visible: true, category: 'identification' },
  
  // DATAS
  { key: 'data_criacao', label: 'Data da Venda', visible: true, category: 'dates' },
  { key: 'data_criacao_claim', label: 'Data da Reclamação', visible: true, category: 'dates' },
  { key: 'data_fechamento_claim', label: 'Data Final da Reclamação', visible: true, category: 'dates' },
  { key: 'data_inicio_return', label: 'Data Inicio da Devolução', visible: true, category: 'dates' },
  { key: 'data_primeira_acao', label: 'Data da Primeira Ação', visible: true, category: 'dates' },
  { key: 'tempo_limite_acao', label: 'Data Limite da Ação', visible: true, category: 'dates' },
  { key: 'data_limite_troca', label: 'Data Limite Troca', visible: true, category: 'dates' },
  { key: 'data_processamento_reembolso', label: 'Data Pagamento do Reembolso', visible: true, category: 'dates' },
  { key: 'ultima_sincronizacao', label: 'Ultima Atualização de Busca', visible: true, category: 'dates' },
  { key: 'last_updated', label: '📅 Data Atualizada do Status', visible: true, category: 'dates' },
  { key: 'data_atualizacao_devolucao', label: '📅 Data Atualizada da Devolução', visible: true, category: 'dates' },
  { key: 'data_criacao_devolucao', label: '📅 Data Inicial da Devolução', visible: true, category: 'dates' },
  
  // STATUS
  { key: 'status_devolucao', label: 'Status da Devolução', visible: true, category: 'status' },
  { key: 'resultado_final', label: 'Resolução', visible: true, category: 'status' },
  
  // COMPRADOR
  { key: 'comprador_nome_completo', label: 'Comprador', visible: true, category: 'buyer' },
  { key: 'comprador_nickname', label: 'Nickname', visible: true, category: 'buyer' },
  
  // PRODUTO
  { key: 'produto_titulo', label: 'Produto', visible: true, category: 'product' },
  { key: 'quantidade', label: 'Qtd', visible: true, category: 'product' },
  
  // FINANCEIRO
  { key: 'valor_original_produto', label: 'Valor Original', visible: true, category: 'financial' },
  { key: 'valor_reembolso_total', label: 'Reembolso Total', visible: true, category: 'financial' },
  { key: 'valor_reembolso_produto', label: 'Reembolso Produto', visible: true, category: 'financial' },
  { key: 'frete_original', label: 'Frete Original', visible: true, category: 'financial' },
  { key: 'frete_reembolsado', label: 'Frete Reembolsado', visible: true, category: 'financial' },
  { key: 'taxa_ml_original', label: 'Taxa ML Original', visible: true, category: 'financial' },
  { key: 'valor_retido', label: 'Valor Retido', visible: true, category: 'financial' },
  
  // MOTIVO
  { key: 'data_processamento_reembolso_grupo7', label: 'Data Reembolso', visible: true, category: 'reason' },
  { key: 'reason_id', label: 'N.º do Motivo', visible: true, category: 'reason' },
  { key: 'reason_name', label: 'Motivo da Reclamação', visible: true, category: 'reason' },
  { key: 'tipo_claim', label: 'Tipo de Reclamação', visible: true, category: 'reason' },
  { key: 'nivel_complexidade', label: 'Nivel Dificuldade', visible: true, category: 'reason' },
  
  // MEDIAÇÃO
  { key: 'resultado_mediacao', label: 'Resultado Mediação', visible: true, category: 'mediation' },
  { key: 'mediador_ml', label: 'Mediador', visible: true, category: 'mediation' },
  { key: 'resultado_final_mediacao', label: 'Resultado Final', visible: true, category: 'mediation' },
  { key: 'responsavel_custo', label: 'Responsável Custo', visible: true, category: 'mediation' },
  { key: 'eh_troca', label: 'É Troca?', visible: true, category: 'mediation' },
  { key: 'escalado_para_ml', label: 'Escalado VIP', visible: true, category: 'mediation' },
  { key: 'tags_pedido', label: 'Tags Pedido', visible: true, category: 'mediation' },
  { key: 'problemas_encontrados', label: 'Problemas', visible: true, category: 'mediation' },
  
  // COMUNICAÇÃO
  { key: 'mensagens_nao_lidas', label: 'Msgs Não Lidas', visible: true, category: 'communication' },
  { key: 'ultima_msg_data', label: 'Última Msg Data', visible: true, category: 'communication' },
  { key: 'ultima_msg_remetente', label: 'Última Msg Remetente', visible: true, category: 'communication' },
  { key: 'timeline_mensagens', label: 'Mensagens', visible: true, category: 'communication' },
  
  // RASTREAMENTO
  { key: 'shipment_id', label: 'N.º do Envio', visible: true, category: 'tracking' },
  { key: 'codigo_rastreamento', label: 'Codigo do Rastreio', visible: true, category: 'tracking' },
];

interface DevolucaoColumnSelectorProps {
  columns: DevolucaoColumnConfig[];
  onColumnsChange: (columns: DevolucaoColumnConfig[]) => void;
}

export function DevolucaoColumnSelector({ columns, onColumnsChange }: DevolucaoColumnSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleColumnToggle = (key: string, checked: boolean) => {
    const updatedColumns = columns.map(col => 
      col.key === key ? { ...col, visible: checked } : col
    );
    onColumnsChange(updatedColumns);
  };

  const handleCategoryToggle = (category: string, checked: boolean) => {
    const updatedColumns = columns.map(col => 
      col.category === category ? { ...col, visible: checked } : col
    );
    onColumnsChange(updatedColumns);
  };

  const resetToDefault = () => {
    onColumnsChange(DEFAULT_DEVOLUCAO_COLUMNS);
  };

  const groupedColumns = columns.reduce((acc, col) => {
    if (!acc[col.category]) {
      acc[col.category] = [];
    }
    acc[col.category].push(col);
    return acc;
  }, {} as Record<string, DevolucaoColumnConfig[]>);

  const categoryLabels = {
    identification: 'Identificação',
    dates: 'Datas',
    status: 'Status',
    buyer: 'Comprador',
    product: 'Produto',
    financial: 'Financeiro',
    reason: 'Motivo',
    mediation: 'Mediação',
    communication: 'Comunicação',
    tracking: 'Rastreamento'
  };

  const visibleColumnsCount = columns.filter(col => col.visible).length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Colunas ({visibleColumnsCount})
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Configurar Colunas</SheetTitle>
          <SheetDescription>
            Selecione as colunas que deseja exibir na tabela de devoluções
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-medium">
              {visibleColumnsCount} de {columns.length} colunas visíveis
            </span>
            <Button variant="outline" size="sm" onClick={resetToDefault}>
              Restaurar Padrão
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {Object.entries(groupedColumns).map(([category, cols]) => {
              const visibleInCategory = cols.filter(col => col.visible).length;
              const allVisible = visibleInCategory === cols.length;
              const someVisible = visibleInCategory > 0 && visibleInCategory < cols.length;

              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center space-x-2 border-b pb-2">
                    <input
                      type="checkbox"
                      id={`category-${category}`}
                      checked={allVisible}
                      ref={(el) => {
                        if (el) el.indeterminate = someVisible;
                      }}
                      onChange={(e) => 
                        handleCategoryToggle(category, e.target.checked)
                      }
                      className="rounded border-border"
                    />
                    <label 
                      htmlFor={`category-${category}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {categoryLabels[category as keyof typeof categoryLabels]} 
                      <span className="text-muted-foreground ml-1">
                        ({visibleInCategory}/{cols.length})
                      </span>
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 ml-6">
                    {cols.map((col) => (
                      <div key={col.key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={col.key}
                          checked={col.visible}
                          onChange={(e) => 
                            handleColumnToggle(col.key, e.target.checked)
                          }
                          className="rounded border-border"
                        />
                        <label 
                          htmlFor={col.key}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {col.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
