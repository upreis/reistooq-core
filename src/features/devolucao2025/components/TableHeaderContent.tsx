/**
 * 📋 COMPONENTE REUTILIZÁVEL - Conteúdo do Cabeçalho da Tabela
 * Usado tanto na tabela original quanto no clone fixo
 */

import { TableHead, TableRow } from '@/components/ui/table';

interface TableHeaderContentProps {
  visibleColumns: string[];
  isVisible: (columnId: string) => boolean;
}

export const TableHeaderContent = ({ visibleColumns, isVisible }: TableHeaderContentProps) => {
  return (
    <TableRow className="hover:bg-transparent border-b-2">
      {/* COLUNA ANÁLISE - PRIMEIRA COLUNA */}
      <TableHead className="sticky left-0 z-10 bg-background">Análise</TableHead>
      
      {/* COLUNA ANOTAÇÕES - APÓS ANÁLISE */}
      <TableHead>Anotações</TableHead>
      
      {/* GRUPO 1: IDENTIFICAÇÃO & BÁSICOS */}
      {isVisible('account_name') && <TableHead>Empresa</TableHead>}
      {isVisible('order_id') && <TableHead>Pedido</TableHead>}
      {isVisible('claim_id') && <TableHead>Claim ID</TableHead>}
      {isVisible('comprador') && <TableHead>Comprador</TableHead>}
      {isVisible('produto') && <TableHead className="w-[350px] min-w-[350px] max-w-[350px]">Produto</TableHead>}
      {isVisible('sku') && <TableHead>SKU</TableHead>}
      {isVisible('quantidade') && <TableHead>Qtd</TableHead>}

      {/* GRUPO 2: FINANCEIRO */}
      {isVisible('valor_total') && <TableHead>Valor Total</TableHead>}
      {isVisible('valor_produto') && <TableHead>Valor Produto</TableHead>}

      {/* GRUPO 3: STATUS & CLASSIFICAÇÃO */}
      {isVisible('status_dev') && <TableHead>Status Dev</TableHead>}
      {isVisible('status_return') && <TableHead>Status Return</TableHead>}
      {isVisible('tipo_claim') && <TableHead>Tipo de Reclamação</TableHead>}
      {isVisible('status_entrega') && <TableHead>Status Entrega</TableHead>}
      {isVisible('destino') && <TableHead>Destino</TableHead>}
      {isVisible('resolucao') && <TableHead>Resolução</TableHead>}

      {/* GRUPO 4: DATAS */}
      {isVisible('data_criacao') && <TableHead>Data Criação</TableHead>}
      {isVisible('data_venda') && <TableHead>Data Venda</TableHead>}
      {isVisible('data_fechamento') && <TableHead>Devolução Cancelada</TableHead>}
      {isVisible('data_inicio_return') && <TableHead>Início Return</TableHead>}
      {isVisible('data_atualizacao') && <TableHead>Última Atualização Return</TableHead>}
      {isVisible('prazo_analise') && <TableHead>Prazo Análise</TableHead>}
      {isVisible('data_chegada') && <TableHead>Devolução Recebida</TableHead>}
      {isVisible('ultima_msg') && <TableHead>Última Msg</TableHead>}

      {/* GRUPO 5: RASTREAMENTO & LOGÍSTICA */}
      {isVisible('codigo_rastreio') && <TableHead>Código Rastreio</TableHead>}
      {isVisible('tipo_logistica') && <TableHead>Tipo Logística</TableHead>}

      {/* GRUPO 7: MEDIAÇÃO & TROCA */}
      {isVisible('eh_troca') && <TableHead>É Troca</TableHead>}

      {/* GRUPO 8: COMUNICAÇÃO */}
      {isVisible('num_interacoes') && <TableHead>Nº Interações</TableHead>}
      {isVisible('qualidade_com') && <TableHead>Qualidade Com</TableHead>}

      {/* GRUPO 9: CUSTOS OPERACIONAIS */}
      {isVisible('custo_envio_orig') && <TableHead>Custo Envio Orig</TableHead>}
    </TableRow>
  );
};
