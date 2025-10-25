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
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>N.º da Venda</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>N.º da Reclamação</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>N.º da Devolução</th>
            {/* ❌ REMOVIDO: Player Role - vazio */}
            {/* ❌ REMOVIDO: Item ID - vazio */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>SKU</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>ID de Pagamento</th>
            
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
            
            {/* GRUPO 3: STATUS E ESTADO (3 colunas) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Status da Devolução</th>
            {/* ❌ REMOVIDO: Etapa - excluído conforme solicitação do usuário */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Resolução</th>
            {/* ❌ REMOVIDO: Status Rastreio - vazio */}
            {/* ❌ REMOVIDO: Status Review - vazio */}
            {/* ❌ REMOVIDO: Status Moderação - excluído conforme solicitação do usuário */}
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
            {/* ❌ REMOVIDO: Data Processamento - duplicada, movida para GRUPO 7 */}
            {/* ❌ REMOVIDO: Parcelas - vazio */}
            {/* ❌ REMOVIDO: Valor Parcela - vazio */}
            
            {/* GRUPO 7: MOTIVO E CATEGORIA (8 colunas) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '170px'}}>Data Reembolso</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '100px'}}>N.º do Motivo</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '200px'}}>Motivo da Reclamação</th>
            {/* ❌ REMOVIDO: Reason Detail - vazio */}
            {/* ❌ REMOVIDO: Reason Flow - vazio */}
            {/* ❌ REMOVIDO: Categoria Motivo - vazio */}
            {/* ❌ REMOVIDO: Tipo Problema - vazio */}
            {/* ❌ REMOVIDO: Subtipo - vazio */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '120px'}}>Tipo de Reclamação</th>
            {/* ❌ REMOVIDO: Estágio - excluído conforme solicitação do usuário */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Nivel Dificuldade</th>
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
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>N.º do Envio</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '150px'}}>Codigo do Rastreio</th>
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
            {/* ❌ REMOVIDO: Revisor - excluído conforme solicitação do usuário */}
      
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