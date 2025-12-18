/**
 * 📋 COMPONENTE REUTILIZÁVEL - Conteúdo do Cabeçalho da Tabela
 * ✅ Padrão sticky header nativo - todos os TH com bg-background
 */

import { TableHead, TableRow } from '@/components/ui/table';

interface TableHeaderContentProps {
  visibleColumns: string[];
  isVisible: (columnId: string) => boolean;
}

export const TableHeaderContent = ({ visibleColumns, isVisible }: TableHeaderContentProps) => {
  return (
    <TableRow className="hover:bg-transparent border-b-2">
      {/* COLUNA ANÁLISE - PRIMEIRA COLUNA (sticky horizontal + vertical) */}
      <TableHead className="sticky left-0 z-30 bg-background">Análise</TableHead>
      
      {/* COLUNA ANOTAÇÕES - APÓS ANÁLISE */}
      <TableHead className="bg-background">Anotações</TableHead>
      
      {/* GRUPO 1: IDENTIFICAÇÃO & BÁSICOS */}
      {isVisible('account_name') && <TableHead className="bg-background">Empresa</TableHead>}
      {isVisible('order_id') && <TableHead className="bg-background">Pedido</TableHead>}
      {isVisible('claim_id') && <TableHead className="bg-background">Claim ID</TableHead>}
      {isVisible('comprador') && <TableHead className="bg-background">Comprador</TableHead>}
      {isVisible('produto') && <TableHead className="bg-background w-[350px] min-w-[350px] max-w-[350px]">Produto</TableHead>}
      {isVisible('sku') && <TableHead className="bg-background">SKU</TableHead>}
      {isVisible('quantidade') && <TableHead className="bg-background">Qtd</TableHead>}

      {/* GRUPO 2: FINANCEIRO */}
      {isVisible('valor_total') && <TableHead className="bg-background">Valor Total</TableHead>}
      {isVisible('valor_produto') && <TableHead className="bg-background">Valor Produto</TableHead>}

      {/* GRUPO 3: STATUS & CLASSIFICAÇÃO */}
      {isVisible('status_dev') && <TableHead className="bg-background">Status Dev</TableHead>}
      {isVisible('status_return') && <TableHead className="bg-background">Status Return</TableHead>}
      {isVisible('tipo_claim') && <TableHead className="bg-background">Tipo de Reclamação</TableHead>}
      {isVisible('status_entrega') && <TableHead className="bg-background">Status Entrega</TableHead>}
      {isVisible('destino') && <TableHead className="bg-background">Destino</TableHead>}
      {isVisible('resolucao') && <TableHead className="bg-background">Resolução</TableHead>}

      {/* GRUPO 4: DATAS */}
      {isVisible('data_criacao') && <TableHead className="bg-background">Data Criação</TableHead>}
      {isVisible('data_venda') && <TableHead className="bg-background">Data Venda</TableHead>}
      {isVisible('data_fechamento') && <TableHead className="bg-background">Devolução Cancelada</TableHead>}
      {isVisible('data_inicio_return') && <TableHead className="bg-background">Início Return</TableHead>}
      {isVisible('data_atualizacao') && <TableHead className="bg-background">Última Atualização Return</TableHead>}
      {isVisible('prazo_analise') && <TableHead className="bg-background">Prazo Análise</TableHead>}
      {isVisible('data_chegada') && <TableHead className="bg-background">Devolução Recebida</TableHead>}
      {isVisible('ultima_msg') && <TableHead className="bg-background">Última Msg</TableHead>}

      {/* GRUPO 5: RASTREAMENTO & LOGÍSTICA */}
      {isVisible('codigo_rastreio') && <TableHead className="bg-background">Código Rastreio</TableHead>}
      {isVisible('tipo_logistica') && <TableHead className="bg-background">Tipo Logística</TableHead>}

      {/* GRUPO 7: MEDIAÇÃO & TROCA */}
      {isVisible('eh_troca') && <TableHead className="bg-background">É Troca</TableHead>}

      {/* GRUPO 8: COMUNICAÇÃO */}
      {isVisible('num_interacoes') && <TableHead className="bg-background">Nº Interações</TableHead>}
      {isVisible('qualidade_com') && <TableHead className="bg-background">Qualidade Com</TableHead>}

      {/* GRUPO 9: CUSTOS OPERACIONAIS */}
      {isVisible('custo_envio_orig') && <TableHead className="bg-background">Custo Envio Orig</TableHead>}
    </TableRow>
  );
};
