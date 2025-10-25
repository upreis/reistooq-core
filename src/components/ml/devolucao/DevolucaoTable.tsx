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
            
            {/* GRUPO 1: IDENTIFICAÇÃO (3 colunas) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Pedido ID</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Claim ID</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Return ID</th>
            {/* ❌ REMOVIDO: Player Role - vazio */}
            {/* ❌ REMOVIDO: Item ID - vazio */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>SKU</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Transação ID</th>
            
            {/* GRUPO 2: DATAS E TIMELINE (16 colunas - +5 novas) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Data Criação</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Data Criação Claim</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Data Fechamento</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Início Devolução</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Primeira Ação</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Prazo Limite</th>
            {/* ❌ REMOVIDO: Data Estimada Troca - vazio */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Data Limite Troca</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Vencimento ACAS</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '170px'}}>Processamento Reembolso</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Última Sync</th>
            {/* 🆕 NOVAS DATAS DA API ML */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '180px'}}>📅 last_updated (API ML)</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '180px'}}>📅 Atualização Return</th>
            {/* ❌ REMOVIDO: 📅 Último Status - vazio */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '180px'}}>📅 Criação Reason</th>
            {/* ❌ REMOVIDO: 📅 Última Movimentação - vazio */}
            
            {/* GRUPO 3: STATUS E ESTADO (3 colunas) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Status</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '100px'}}>Etapa</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Resolução</th>
            {/* ❌ REMOVIDO: Status Rastreio - vazio */}
            {/* ❌ REMOVIDO: Status Review - vazio */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>Status Moderação</th>
            {/* ❌ REMOVIDO: SLA Cumprido (comparação de datas) */}
            
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
            {/* ❌ REMOVIDO: Compensação - não está sendo mapeado pela API */}
            
            {/* ❌ REMOVIDO: Método Reembolso - vazio */}
            {/* ❌ REMOVIDO: Moeda - vazio */}
            {/* ❌ REMOVIDO: Data Processamento - vazio */}
            {/* ❌ REMOVIDO: Parcelas - vazio */}
            {/* ❌ REMOVIDO: Valor Parcela - vazio */}
            
            {/* GRUPO 7: MOTIVO E CATEGORIA (11 colunas) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Reason ID</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '200px'}}>Reason Name</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '250px'}}>Reason Detail</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Reason Flow</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '180px'}}>Categoria Motivo</th>
            {/* ❌ REMOVIDO: Tipo Problema - vazio */}
            {/* ❌ REMOVIDO: Subtipo - vazio */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Tipo Claim</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '100px'}}>Estágio</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Complexidade</th>
            {/* ❌ REMOVIDO: Nível Prioridade - vazio */}
            
            {/* GRUPO 8: MEDIAÇÃO E RESOLUÇÃO (9 colunas) */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '160px'}}>Resultado Mediação</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Mediador</th>
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
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Shipment ID</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Rastreio</th>
            {/* ❌ REMOVIDO: Status Envio - vazio */}
            {/* ❌ REMOVIDO: Centro Envio - vazio */}
            {/* ❌ REMOVIDO: Plataforma - vazio */}
            {/* ❌ REMOVIDO: NF Autorizada - vazio */}
            {/* 🆕 NOVOS CAMPOS DE LOGÍSTICA */}
            {/* ❌ REMOVIDO: 📦 Shipment ID Dev. - vazio */}
            {/* ❌ REMOVIDO: 📍 Endereço Destino - vazio */}
            {/* ❌ REMOVIDO: 📝 Desc. Último Status - vazio */}
            
            {/* ❌ REMOVIDO GRUPO 12: QUALIDADE E SCORES - todos vazios */}
            {/* ❌ REMOVIDO: Score Qualidade (calculado) */}
            {/* ❌ REMOVIDO: Taxa Satisfação (calculado) */}
            {/* ❌ REMOVIDO: Score Final (calculado) */}
            {/* ❌ REMOVIDO: Impacto Reputação (calculado) */}
            {/* ❌ REMOVIDO: Calificação CARL - vazio */}
            {/* ❌ REMOVIDO: Review ID - vazio */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Revisor</th>
      
      {/* ❌ REMOVIDO GRUPO 13: DADOS DETALHADOS - todos vazios */}
            {/* ❌ REMOVIDO: Dados Claim - vazio */}
            {/* ❌ REMOVIDO: Dados Return - vazio */}
            {/* ❌ REMOVIDO: Envio Mediação - vazio */}
            
            {/* 🆕 GRUPO 14: NOVOS DADOS ESTRUTURADOS (3 colunas) - ANTES DE AÇÕES */}
            {/* ❌ REMOVIDO: Reviews (consolidação) */}
            {/* ❌ REMOVIDO: Custos (consolidação) */}
            {/* ❌ REMOVIDO: Reasons (consolidação) */}
            
            {/* AÇÕES */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground sticky right-0 bg-muted/50 dark:bg-muted z-10" style={{minWidth: '100px'}}>Ações</th>
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