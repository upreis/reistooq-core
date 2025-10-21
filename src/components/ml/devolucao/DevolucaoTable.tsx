import React, { useState } from 'react';
import { DevolucaoTableRow } from './DevolucaoTableRow';
import { MensagensModal } from './MensagensModal';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface DevolucaoTableProps {
  devolucoes: DevolucaoAvancada[];
  onViewDetails: (devolucao: DevolucaoAvancada) => void;
}

export const DevolucaoTable = React.memo<DevolucaoTableProps>(({
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
            
            {/* GRUPO 1: IDENTIFICAÇÃO (6 colunas) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Pedido ID</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Claim ID</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Player Role</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '100px'}}>Item ID</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>SKU</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Transação ID</th>
            
            {/* GRUPO 2: DATAS E TIMELINE (11 colunas) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Data Criação</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Data Criação Claim</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Data Fechamento</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Início Devolução</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Primeira Ação</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Prazo Limite</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Data Estimada Troca</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Data Limite Troca</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Vencimento ACAS</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '170px'}}>Processamento Reembolso</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Última Sync</th>
            
            {/* GRUPO 3: STATUS E ESTADO (7 colunas) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Status</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '100px'}}>Etapa</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Resolução</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Status Rastreio</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Status Review</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Status Moderação</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>SLA Cumprido</th>
            
            {/* GRUPO 4: COMPRADOR (4 colunas) */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '180px'}}>Comprador</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Nickname</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '200px'}}>Email</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '180px'}}>Cooperador</th>
            
            {/* GRUPO 5: PRODUTO (4 colunas) */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '300px'}}>Produto</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '60px'}}>Qtd</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Categoria</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '100px'}}>Garantia</th>
            
            {/* GRUPO 6: VALORES FINANCEIROS (20 colunas - expandido com detalhes do modal) */}
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Valor Original</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Reembolso Total</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Reembolso Produto</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>% Reembolsado</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Impacto Vendedor</th>
            
            {/* Frete e Logística Detalhado */}
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Frete Original</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Frete Reembolsado</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Custo Devolução</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Total Logística</th>
            
            {/* Taxas ML Detalhado */}
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Taxa ML Original</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Taxa ML Reembolsada</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Taxa ML Retida</th>
            
            {/* Outros valores */}
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Valor Retido</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Compensação</th>
            
            {/* Informações de Pagamento */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Método Reembolso</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '80px'}}>Moeda</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '170px'}}>Data Processamento</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '80px'}}>Parcelas</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '110px'}}>Valor Parcela</th>
            
            {/* GRUPO 7: MOTIVO E CATEGORIA (8 colunas) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '100px'}}>Reason ID</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '180px'}}>Categoria Motivo</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '160px'}}>Tipo Problema</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Subtipo</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Tipo Claim</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Complexidade</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Nível Prioridade</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Cód. Classificação</th>
            
            {/* GRUPO 8: MEDIAÇÃO E RESOLUÇÃO (12 colunas) */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '160px'}}>Resultado Mediação</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Mediador</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Método Resolução</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Resultado Final</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Review Result</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Resolvida ACAS</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '100px'}}>É Troca?</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Escalado VIP</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '160px'}}>Ação Seller Necessária</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Total Evidências</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Recursos Manuais</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '180px'}}>Problemas</th>
            
            {/* GRUPO 9: FEEDBACK E COMUNICAÇÃO (7 colunas) */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '220px'}}>Feedback Comprador</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '220px'}}>Feedback Vendedor</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Msgs Não Lidas</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Qtd Comunicações</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '200px'}}>Timeline</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Última Msg Data</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Última Msg Remetente</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '200px'}}>Mensagens</th>
            
            {/* GRUPO 10: TEMPOS E MÉTRICAS (8 colunas) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Tempo Resposta</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '160px'}}>1ª Resposta Vendedor</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Tempo Total</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Tempo Análise ML</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Tempo Resp. Inicial</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Dias p/ Resolver</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Prazo Revisar</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '110px'}}>Eficiência</th>
            
            {/* GRUPO 11: RASTREAMENTO E LOGÍSTICA (7 colunas) */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Transportadora</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Shipment ID</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Rastreio</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Status Envio</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Centro Envio</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Plataforma</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>NF Autorizada</th>
            
            {/* GRUPO 12: QUALIDADE E SCORES (7 colunas) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Score Qualidade</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Taxa Satisfação</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Score Final</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Impacto Reputação</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Calificação CARL</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Review ID</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Revisor</th>
            
            {/* GRUPO 13: DADOS DETALHADOS (3 colunas) */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '200px'}}>Dados Claim</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '200px'}}>Dados Return</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Envio Mediação</th>
            
            {/* 🆕 GRUPO 14: NOVOS DADOS ESTRUTURADOS (3 colunas) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Reviews Disponíveis</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Custos Detalhados</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Reasons Detalhados</th>
            
            {/* AÇÕES */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '100px'}}>Ações</th>
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
});