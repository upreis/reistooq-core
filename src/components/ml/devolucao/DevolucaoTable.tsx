import React from 'react';
import { DevolucaoTableRow } from './DevolucaoTableRow';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface DevolucaoTableProps {
  devolucoes: DevolucaoAvancada[];
  onViewDetails: (devolucao: DevolucaoAvancada) => void;
}

export const DevolucaoTable: React.FC<DevolucaoTableProps> = ({
  devolucoes,
  onViewDetails
}) => {
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted/50 dark:bg-muted border-b">
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">Order ID</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">Produto</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">Claim ID</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">SKU</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">Comprador</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[60px]">Qtd</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">Valor Retido</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">Status</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">Conta ML</th>
            
            {/* COLUNAS ORIGINAIS MANTIDAS */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📋 Claim</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📦 Return</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">⚖️ Mediação</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📎 Anexos</th>
            
            {/* MENSAGENS E COMUNICAÇÃO (novas) */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[300px]">💬 Mensagens (Texto)</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">🔔 Não Lidas</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[90px]">👮 Moderação</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Últ Msg</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[250px]">💬 Última Mensagem (Texto)</th>
            
            {/* DATAS E PRAZOS (novas) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">⏰ Dias Rest.</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Venc. Ação</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Est. Troca</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Lim. Troca</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">📝 Prazo Rev.</th>
            
            {/* RASTREAMENTO E LOGÍSTICA (novas) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[90px]">🚛 Rastreio</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🚚 Transport.</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">📍 Status Env.</th>
            
            {/* CUSTOS E FINANCEIRO (novas) */}
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">💰 Custo Env.</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">💸 Compensação</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">💱 Moeda</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🏢 Resp. Custo</th>
            
            {/* CLASSIFICAÇÃO E RESOLUÇÃO (novas) */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">🏷️ Tipo</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">🏷️ Subtipo</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">⚖️ Em Mediação</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🎯 Método Resolução</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">🚨 Prioridade</th>
            
            {/* MÉTRICAS E KPIS (novas) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">⏱️ Resp (min)</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">🏁 Total (min)</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">📊 Evidências</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">😊 Satisfação</th>
            
            {/* ESTADOS E FLAGS (novas) */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[60px]">🔄 Troca</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[60px]">🚀 ML</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[60px]">✋ Ação Req.</th>
            
            {/* 📊 MÉTRICAS ADICIONAIS */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">⏱️ Tempo 1ª Resp</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🏁 Tempo Total</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">📊 Dias Resolução</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">✅ SLA</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">⭐ Score Satisfação</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">💨 Eficiência</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🎯 Resultado</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🌟 Reputação</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">📝 Próx Ação</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🛠️ Revisor</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">📊 Score Qual.</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">⚠️ Ação Manual</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🔍 Ações</th>
          </tr>
        </thead>
        <tbody>
          {devolucoes.map((devolucao) => (
            <DevolucaoTableRow
              key={devolucao.id}
              devolucao={devolucao}
              onViewDetails={onViewDetails}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
