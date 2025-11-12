import React, { useState } from 'react';
import { DevolucaoTableRow } from './DevolucaoTableRow';
import { MensagensModal } from './MensagensModal';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface DevolucaoTableProps {
  devolucoes: DevolucaoAvancada[];
  onViewDetails: (devolucao: DevolucaoAvancada) => void;
}

const DevolucaoTableComponent: React.FC<DevolucaoTableProps> = ({
  devolucoes,
  onViewDetails
}) => {
  const [mensagensModalOpen, setMensagensModalOpen] = useState(false);
  const [selectedDevolucao, setSelectedDevolucao] = useState<DevolucaoAvancada | null>(null);
  
  const handleOpenMensagens = (devolucao: DevolucaoAvancada) => {
    setSelectedDevolucao(devolucao);
    setMensagensModalOpen(true);
  };
  
  return (
    <>
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted/50 dark:bg-muted border-b">
            {/* PRIMEIRA COLUNA - Nome da Conta */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground sticky left-0 bg-muted/50 dark:bg-muted z-10" style={{minWidth: '160px'}}>Empresa</th>
            
            {/* GRUPO 1: IDENTIFICAÇÃO E RASTREABILIDADE (7 colunas - FASES 1-3 implementadas) */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground sticky left-0 bg-muted/50 dark:bg-muted z-10 border-r" style={{minWidth: '140px'}}>Nome da Conta</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>CPF/CNPJ</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Power Seller</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Mercado Líder</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>ID do Claim</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>ID do Pedido</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '110px'}}>ID da Devolução</th>
            
            {/* GRUPO 2: DATAS E TIMELINE (16 colunas - +5 novas) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Data da Venda</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Data da Reclamação</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Data Final da Reclamação</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Data Inicio da Devolução</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Data da Primeira Ação</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Data Limite da Ação</th>
            {/* ❌ REMOVIDO: Data Estimada Troca - vazio */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Data Limite Troca</th>
            {/* ❌ REMOVIDO: Vencimento ACAS - excluído conforme solicitação do usuário */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '170px'}}>Data Pagamento do Reembolso</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Ultima Atualização de Busca</th>
            {/* 🆕 NOVAS DATAS DA API ML */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '180px'}}>📅 Data Atualizada do Status</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '180px'}}>📅 Data Atualizada da Devolução</th>
            {/* ❌ REMOVIDO: 📅 Último Status - vazio */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '180px'}}>📅 Data Inicial da Devolução</th>
            {/* ❌ REMOVIDO: 📅 Última Movimentação - vazio */}
            
            {/* GRUPO 3: STATUS E ESTADO (6 colunas) - ✅ CORREÇÃO 3: Status $ e Tipo Recurso */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Status da Devolução</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Status $</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Tipo Recurso</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Resolução</th>
            {/* 🆕 AÇÃO OBRIGATÓRIA - Destaca ações mandatory do seller */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '160px'}}>🚨 Ação Obrigatória</th>
            
            {/* GRUPO 4: COMPRADOR (2 colunas) */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '180px'}}>Comprador</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Nickname</th>
            {/* ❌ REMOVIDO: Email - vazio */}
            {/* ❌ REMOVIDO: Cooperador - vazio */}
            
            {/* GRUPO 5: PRODUTO (2 colunas) */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '300px'}}>Produto</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '60px'}}>Qtd</th>
            {/* ❌ REMOVIDO: Categoria - vazio */}
            {/* ❌ REMOVIDO: Garantia - vazio */}
            
            {/* GRUPO 6: VALORES FINANCEIROS (20 colunas - expandido com detalhes do modal) */}
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Valor Original</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Reembolso Total</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Reembolso Produto</th>
            {/* ❌ REMOVIDO: % Reembolsado (calculado) */}
            {/* ❌ REMOVIDO: Impacto Vendedor (calculado) */}
            
            {/* Frete e Logística Detalhado */}
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Frete Original</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Frete Reembolsado</th>
            {/* ❌ REMOVIDO: Custo Devolução - vazio */}
            {/* ❌ REMOVIDO: Total Logística (calculado) */}
            
            {/* Taxas ML Detalhado */}
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Taxa ML Original</th>
            {/* ❌ REMOVIDO: Taxa ML Reembolsada - API não fornece separadamente */}
            {/* ❌ REMOVIDO: Taxa ML Retida - API não fornece este dado */}
            
            {/* Outros valores */}
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Valor Retido</th>
            
            {/* 🆕 FINANCEIRO DETALHADO - 9 novas colunas */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Status $</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Método Reembolso</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '80px'}}>Moeda</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>% Reembolsado</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Diferença Troca</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Taxa ML Reemb.</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Custo Devolução</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '100px'}}>Parcelas</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Valor Parcela</th>
            
            {/* 🆕 Custos Logística - breakdown detalhado via hover */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Custos Logística</th>
            
            {/* 🆕 PRIORIDADE ALTA - Rastreamento (3 colunas já existentes) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Data Est. Entrega</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Tem Atraso?</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Qtd Devolvida/Total</th>
            
            {/* 🆕 RASTREAMENTO DETALHADO - 10 novas colunas */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Limite Entrega</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Status Shipment</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Refund At</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Review Method</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Review Stage</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '200px'}}>Localização Atual</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Status Transporte</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Tracking History</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Tracking Events</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '160px'}}>Última Movimentação</th>
            
            {/* 🆕 PRIORIDADE ALTA - Comunicação (2 colunas já existentes) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Qualidade Comunicação</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>N° Interações</th>
            
            {/* 🆕 COMUNICAÇÃO DETALHADA - 6 novas colunas */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Timeline Events</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Marcos Temporais</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '160px'}}>Data Criação Claim</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '160px'}}>Data Início Return</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '170px'}}>Data Fechamento Claim</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Histórico Status</th>
            
            {/* 🆕 PRIORIDADE ALTA - Mediação e Transação (2 colunas já existentes) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Mediador ML</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '160px'}}>Transaction ID</th>
            
            {/* 🆕 MEDIAÇÃO DETALHADA - 6 novas colunas */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '160px'}}>Resultado Mediação</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Detalhes Mediação</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Produto Troca ID</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Novo Pedido ID</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Dias Restantes Ação</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Prazo Revisão Dias</th>
            
            {/* 🆕 METADADOS - 3 novas colunas */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Usuário Última Ação</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Total Evidências</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Anexos ML</th>
            
            {/* 🆕 FASE 2: PACK DATA - 5 novas colunas */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Pack ID</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>É Pedido Múltiplo?</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Itens do Pack</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Motivo Cancelamento</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '180px'}}>Campo Custom Vendedor</th>
            
            {/* ❌ REMOVIDO: Método Reembolso - vazio */}
            {/* ❌ REMOVIDO: Moeda - vazio */}
            {/* ❌ REMOVIDO: Data Processamento - duplicada, movida para GRUPO 7 */}
            {/* ❌ REMOVIDO: Parcelas - vazio */}
            {/* ❌ REMOVIDO: Valor Parcela - vazio */}
            
            {/* GRUPO 7: MOTIVO E CATEGORIA (9 colunas - adicionada Data Est. Reembolso) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '170px'}}>Data Reembolso</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '170px'}}>Data Est. Reembolso</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '100px'}}>N.º do Motivo</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '200px'}}>Descrição do Motivo</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '200px'}}>Reason Detail</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Reason Flow</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Tipo Problema</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Subtipo Problema</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Tipo de Claim</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Prioridade</th>
            {/* ❌ REMOVIDO: Nível Prioridade - vazio */}
            
            {/* GRUPO 8: MEDIAÇÃO E RESOLUÇÃO (9 colunas) */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '160px'}}>Estágio do Claim</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>ID do Revisor</th>
            {/* ❌ REMOVIDO: Método Resolução - vazio */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Resultado Final</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '160px'}}>Responsável Custo</th>
            {/* ❌ REMOVIDO: Review Result - vazio */}
            {/* ❌ REMOVIDO: Resolvida ACAS - vazio */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '100px'}}>É Troca?</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Escalado VIP</th>
            {/* ❌ REMOVIDO: Ação Seller Necessária (lógica de verificação) */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '180px'}}>Tags Pedido</th>
            {/* ❌ REMOVIDO: Total Evidências (soma) */}
            {/* ❌ REMOVIDO: Recursos Manuais - vazio */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '180px'}}>Problemas</th>
            
            {/* GRUPO 9: FEEDBACK E COMUNICAÇÃO (4 colunas) */}
            {/* ❌ REMOVIDO: Feedback Comprador - vazio */}
            {/* ❌ REMOVIDO: Feedback Vendedor - vazio */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Msgs Não Lidas</th>
            {/* ❌ REMOVIDO: Qtd Comunicações (calculado) */}
            {/* ❌ REMOVIDO: Timeline (agregado) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Última Msg Data</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Última Msg Remetente</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '200px'}}>Mensagens</th>
            
            {/* ❌ REMOVIDO GRUPO 10: TEMPOS E MÉTRICAS - todos vazios */}
            {/* ❌ REMOVIDO: Tempo Resposta (calculado) */}
            {/* ❌ REMOVIDO: 1ª Resposta Vendedor - vazio */}
            {/* ❌ REMOVIDO: Tempo Total (calculado) */}
            {/* ❌ REMOVIDO: Tempo Análise ML - vazio */}
            {/* ❌ REMOVIDO: Tempo Resp. Inicial - vazio */}
            {/* ❌ REMOVIDO: Dias p/ Resolver (calculado) */}
            {/* ❌ REMOVIDO: Prazo Revisar (calculado) */}
            {/* ❌ REMOVIDO: Eficiência (calculado) */}
            
            {/* GRUPO 11: RASTREAMENTO E LOGÍSTICA (2 colunas) */}
            {/* ❌ REMOVIDO: 📦 Tem Devolução - vazio */}
            {/* ❌ REMOVIDO: 💰 Status Reembolso - vazio */}
            {/* ❌ REMOVIDO: Transportadora - vazio */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>N.º do Envio</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Codigo do Rastreio</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Status Rastreio</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Status Review</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '160px'}}>Shipment ID Devolução</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '250px'}}>Endereço Destino</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '200px'}}>Descrição Último Status</th>
            
            {/* VISUALIZAR - STICKY RIGHT */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground sticky right-0 bg-muted/50 dark:bg-muted z-10 border-l" style={{minWidth: '100px'}}>Visualizar</th>
          </tr>
        </thead>
        <tbody>
          {devolucoes.map((devolucao, index) => (
            <DevolucaoTableRow
              key={`${devolucao.id}-${devolucao.claim_id || index}`}
              devolucao={devolucao}
              onViewDetails={onViewDetails}
              onOpenMensagens={handleOpenMensagens}
            />
          ))}
        </tbody>
      </table>
    </div>
    
    {/* Modal de Mensagens */}
    {selectedDevolucao && (
      <MensagensModal
        open={mensagensModalOpen}
        onOpenChange={setMensagensModalOpen}
        mensagens={selectedDevolucao.timeline_mensagens || []}
        orderId={String(selectedDevolucao.order_id)}
      />
    )}
  </>
  );
};

export const DevolucaoTable = React.memo(DevolucaoTableComponent);