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
            
            {/* ========== 16 NOVAS COLUNAS DAS 3 FASES ========== */}
            
            {/* FASE 1: CAMPOS CRÍTICOS OBRIGATÓRIOS */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Data Criação Claim</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Data Fechamento Claim</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Data Início Return</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">🚚 Shipment ID</th>
            
            {/* FASE 2: CAMPOS PRIORITÁRIOS VAZIOS */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📋 Categoria Motivo</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🎯 Complexidade</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">⚠️ Categoria Problema</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">⚖️ Resultado Mediação</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">👨‍⚖️ Mediador ML</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">⏱️ Tempo Resp. Comprador</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">⏱️ Tempo Análise ML</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Data 1ª Ação</th>
            
            {/* FASE 3: CAMPOS OPCIONAIS */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">🔍 Subcategoria Problema</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">💬 Feedback Comprador</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">💬 Feedback Vendedor</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">⏰ Tempo Limite Ação</th>
            
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
            
            {/* ========== FASE 1: CAMPOS OBRIGATÓRIOS (4 COLUNAS) ========== */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[160px]">📅 Data Criação Claim</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[160px]">📅 Data Fechamento Claim</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[160px]">📅 Data Início Return</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">🆔 Shipment ID</th>
            
            {/* ========== FASE 2: CAMPOS PRIORITÁRIOS (8 COLUNAS) ========== */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">🔖 Motivo Categoria</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">🎯 Nível Complexidade</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">📋 Categoria Problema</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">⚖️ Resultado Mediação</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">👨‍⚖️ Mediador ML</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">⏱️ Tempo Resp. Comprador (h)</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">⏱️ Tempo Análise ML (h)</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[160px]">📅 Data Primeira Ação</th>
            
            {/* ========== FASE 3: CAMPOS OPCIONAIS (4 COLUNAS) ========== */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">📌 Subcategoria Problema</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">💬 Feedback Comprador Final</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">💬 Feedback Vendedor</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[160px]">⏰ Prazo Limite Ação</th>

            {/* ========== FASE 2: DADOS DO COMPRADOR E PAGAMENTO (10 COLUNAS) ========== */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">📝 CPF/CNPJ</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">👤 Nome Completo</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">🏷️ Nickname</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">💳 Método Pgto</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">💰 Tipo Pgto</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">🔢 Parcelas</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">💵 Valor Parcela</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">🆔 Transaction ID</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">📊 % Reembolsado</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">🏷️ Tags Pedido</th>
            
            {/* ========== FASE 3: CAMPOS AVANÇADOS (15 COLUNAS) ========== */}
            
            {/* Custos Detalhados */}
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">🚚 Custo Frete Dev</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📦 Custo Log Total</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">💰 Valor Original</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">💵 Reemb Produto</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">💸 Taxa ML Reemb</th>
            
            {/* Internal Tags e Metadados */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">🏷️ Tags Internas</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">💰 Tem Financ</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">📋 Tem Review</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">⏰ Tem SLA</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">📄 NF Autor</th>
            
            {/* Dados de Produto */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">🛡️ Garantia</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">📦 Categoria Prod</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🖼️ Thumbnail</th>
            
            {/* Análise e Qualidade */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">💬 Qual Comunic</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">⚡ Efic Resolução</th>
            
            {/* ========== 60 COLUNAS FALTANTES DO BANCO ========== */}
            
            {/* RASTREAMENTO AVANÇADO */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">🚚 Cód Rastreio Dev</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📦 Transport. Dev</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📍 Localização Atual</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🚦 Status Transp.</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">🔗 URL Rastreio</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Últ Movim</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Prev Entrega Vend</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">⏱️ Dias Trânsito</th>
            
            {/* TROCA E PRODUTO NOVO */}
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">💱 Valor Dif. Troca</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">🆔 Produto Troca ID</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">📦 Status Prod Novo</th>
            
            {/* ENDEREÇO E CUSTOS DETALHADOS */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">🏠 Endereço Destino</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">💰 Descr. Custos</th>
            
            {/* MEDIAÇÃO DETALHADA */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Início Mediação</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">📋 Detalhes Mediação</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">⚖️ Resultado Mediação</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">👨‍⚖️ Mediador ML</th>
            
            {/* FEEDBACK E COMUNICAÇÃO */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">💬 Feedback Comprador</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">💬 Feedback Vendedor</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">📊 Qual. Comunic.</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">😊 Satisf. Comprador</th>
            
            {/* TEMPOS ADICIONAIS */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">⏱️ Resp Comprador</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">⏱️ Análise ML</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 1ª Ação</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">⏰ Tempo Limite Ação</th>
            
            {/* HISTÓRICO E EVENTOS */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">📊 Histórico Status</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">🎯 Timeline Events</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">🔄 Timeline Consol.</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Data Criação Claim</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Início Return</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Final Timeline</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">⚙️ Eventos Sistema</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">📍 Marcos Temporais</th>
            
            {/* TRACKING DETALHADO */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">📊 Tracking History</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">💰 Shipment Costs</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">⏰ Shipment Delays</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">🚚 Carrier Info</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">📌 Tracking Events</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">📍 Hist. Localizações</th>
            
            {/* REVIEW DETALHADO */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">🔧 Ações Review</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Início Review</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">📝 Obs Review</th>
            
            {/* REPUTAÇÃO */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">⭐ Seller Reputation</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">⭐ Buyer Reputation</th>
            
            {/* TAGS E ORIGEM */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">🏷️ Tags Automáticas</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">🌎 Marketplace</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📡 Fonte Primária</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📜 Origem Timeline</th>
            
            {/* DADOS TÉCNICOS E QUALIDADE */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">👤 Últ Usuário</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">🔐 Hash Verif.</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">📊 Confiabilidade</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🔧 Versão API</th>
            
            {/* ========== FASE 4: REASONS API (8 COLUNAS) ========== */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">🔍 Reason ID</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">📋 Reason Nome</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">📝 Reason Detalhe</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">🏷️ Reason Categoria</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">⚡ Reason Prioridade</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">🔖 Reason Tipo</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">✅ Resoluções Esperadas</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">⚙️ Regras Motor</th>
            
            {/* 🆕 5 NOVOS CAMPOS - DADOS PERDIDOS RECUPERADOS */}
            <th className="text-left px-3 py-3 font-semibold text-primary min-w-[140px]">🎯 Estágio Claim</th>
            <th className="text-left px-3 py-3 font-semibold text-primary min-w-[140px]">📦 Tipo Quantidade</th>
            <th className="text-center px-3 py-3 font-semibold text-primary min-w-[120px]">✅ Claim Cumprido</th>
            <th className="text-left px-3 py-3 font-semibold text-primary min-w-[160px]">🔍 Tipo Recurso Return</th>
            <th className="text-left px-3 py-3 font-semibold text-primary min-w-[180px]">📋 Verif. Intermediária</th>
            
            {/* AÇÕES FINAIS - MOVIDA PARA O FINAL */}
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