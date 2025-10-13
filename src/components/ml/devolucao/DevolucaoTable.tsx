import React from 'react';
import { DevolucaoTableRow } from './DevolucaoTableRow';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface DevolucaoTableProps {
  devolucoes: DevolucaoAvancada[];
  onViewDetails: (devolucao: DevolucaoAvancada) => void;
}

export const DevolucaoTable = React.memo<DevolucaoTableProps>(({
  devolucoes,
  onViewDetails
}) => {
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted/50 dark:bg-muted border-b">
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">Order ID</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[140px]">📅 Data Venda</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">Produto</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">Claim ID</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">SKU</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">Comprador</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[60px]">Qtd</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">Valor Retido</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">Status</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">Conta ML</th>
            
            {/* COLUNAS ORIGINAIS */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📋 Claim</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📦 Return</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">⚖️ Mediação</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📎 Anexos</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">⚠️ Ação Manual</th>
            
            {/* 87 NOVAS COLUNAS - DADOS ENRIQUECIDOS */}
            
            {/* MENSAGENS E COMUNICAÇÃO */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[300px]">💬 Mensagens</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">🔔 Não Lidas</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[90px]">👮 Moderação</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Últ Msg</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[250px]">💬 Última Mensagem</th>
            
            {/* DATAS E PRAZOS */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">⏰ Dias Rest.</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Venc. Ação</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Est. Troca</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Lim. Troca</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">📝 Prazo Rev.</th>
            
            {/* RASTREAMENTO E LOGÍSTICA */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">🚛 Rastreio</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🚚 Transport.</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">📍 Status Env.</th>
            
            {/* CUSTOS E FINANCEIRO */}
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">💰 Custo Env.</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">💸 Compensação</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">💱 Moeda</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🏢 Resp. Custo</th>
            
            {/* CLASSIFICAÇÃO E RESOLUÇÃO */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">🏷️ Tipo</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">🏷️ Subtipo</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">⚖️ Em Mediação</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🎯 Método Resolução</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">🚨 Prioridade</th>
            
            {/* MÉTRICAS E KPIS */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">⏱️ Resp (min)</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">🏁 Total (min)</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">📊 Evidências</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">😊 Satisfação</th>
            
            {/* ESTADOS E FLAGS */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[60px]">🔄 Troca</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[60px]">🚀 ML</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[60px]">✋ Ação Req.</th>
            
            {/* MÉTRICAS TEMPORAIS AVANÇADAS */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">⏱️ 1ª Resp</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🏁 Tempo Total</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">📊 Dias Resolução</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">✅ SLA</th>
            
            {/* SATISFAÇÃO E QUALIDADE */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">⭐ Score Satisf.</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">💨 Eficiência</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🎯 Resultado</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🌟 Reputação</th>
            
            {/* AÇÕES E GESTÃO */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">📝 Próx Ação</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🛠️ Revisor</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">📊 Score Qual.</th>
            
            {/* FINANCEIRO AVANÇADO */}
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">💵 Reemb. Total</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">📦 Reemb. Produto</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🚚 Reemb. Frete</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">💸 Taxa ML</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">📊 Custo Log.</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">⚖️ Impacto Vend.</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Proc. Reemb.</th>
            
            {/* REVIEWS E QUALIDADE (FASE 2) */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">🔍 Review ID</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">📋 Status Review</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">✅ Resultado</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">⭐ Score Qual.</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">🔧 Ação Manual</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">⚠️ Problemas</th>
            
            {/* DADOS TÉCNICOS */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">⚠️ Incompleto</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">📋 Campos Falt.</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">🔄 Últ Sync</th>
            
            {/* AÇÕES FINAIS */}
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
});
