import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin, Package, MessageCircle, Clock, Database } from 'lucide-react';

interface AdvancedDataTabProps {
  devolucao: any;
}

export const AdvancedDataTab: React.FC<AdvancedDataTabProps> = ({ devolucao }) => {
  return (
    <div className="space-y-6">
      {/* RASTREAMENTO AVANÇADO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Rastreamento Detalhado
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><Label>Código Rastreio Devolução</Label><p className="font-mono text-sm">{devolucao.codigo_rastreamento_devolucao || '-'}</p></div>
          <div><Label>Transportadora Devolução</Label><p>{devolucao.transportadora_devolucao || '-'}</p></div>
          <div><Label>Localização Atual</Label><p>{devolucao.localizacao_atual || '-'}</p></div>
          <div><Label>Status Transporte</Label><Badge>{devolucao.status_transporte_atual || '-'}</Badge></div>
          <div><Label>Shipment ID</Label><p className="font-mono text-sm">{devolucao.shipment_id || '-'}</p></div>
          <div><Label>Última Movimentação</Label><p>{devolucao.data_ultima_movimentacao ? new Date(devolucao.data_ultima_movimentacao).toLocaleDateString('pt-BR') : '-'}</p></div>
          <div><Label>Previsão Entrega Vendedor</Label><p>{devolucao.previsao_entrega_vendedor ? new Date(devolucao.previsao_entrega_vendedor).toLocaleDateString('pt-BR') : '-'}</p></div>
          <div><Label>Dias em Trânsito</Label><p>{devolucao.tempo_transito_dias || '-'}</p></div>
        </CardContent>
      </Card>

      {/* CATEGORIAS E COMPLEXIDADE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Categorização e Complexidade
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><Label>Motivo Categoria</Label><p>{devolucao.motivo_categoria || '-'}</p></div>
          <div><Label>Categoria Problema</Label><p>{devolucao.categoria_problema || '-'}</p></div>
          <div><Label>Subcategoria Problema</Label><p>{devolucao.subcategoria_problema || '-'}</p></div>
          <div><Label>Nível Complexidade</Label><Badge variant={devolucao.nivel_complexidade === 'high' ? 'destructive' : 'secondary'}>{devolucao.nivel_complexidade || '-'}</Badge></div>
        </CardContent>
      </Card>

      {/* FEEDBACK E COMUNICAÇÃO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Feedback e Comunicação
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div><Label>Feedback Comprador</Label><p className="text-sm">{devolucao.feedback_comprador_final || '-'}</p></div>
          <div><Label>Feedback Vendedor</Label><p className="text-sm">{devolucao.feedback_vendedor || '-'}</p></div>
          <div><Label>Qualidade Comunicação</Label><Badge>{devolucao.qualidade_comunicacao || '-'}</Badge></div>
          <div><Label>Satisfação Comprador</Label><Badge>{devolucao.satisfacao_comprador || '-'}</Badge></div>
        </CardContent>
      </Card>

      {/* TIMELINE E EVENTOS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline e Eventos
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><Label>Data Criação Claim</Label><p>{devolucao.data_criacao_claim ? new Date(devolucao.data_criacao_claim).toLocaleDateString('pt-BR') : '-'}</p></div>
          <div><Label>Início Return</Label><p>{devolucao.data_inicio_return ? new Date(devolucao.data_inicio_return).toLocaleDateString('pt-BR') : '-'}</p></div>
          <div><Label>Finalização Timeline</Label><p>{devolucao.data_finalizacao_timeline ? new Date(devolucao.data_finalizacao_timeline).toLocaleDateString('pt-BR') : '-'}</p></div>
          <div><Label>Timeline Events</Label><p>{devolucao.timeline_events && Array.isArray(devolucao.timeline_events) ? `${devolucao.timeline_events.length} eventos` : '-'}</p></div>
          <div><Label>Eventos Sistema</Label><p>{devolucao.eventos_sistema && Array.isArray(devolucao.eventos_sistema) ? `${devolucao.eventos_sistema.length} eventos` : '-'}</p></div>
          <div><Label>Histórico Status</Label><p>{devolucao.historico_status && Array.isArray(devolucao.historico_status) ? `${devolucao.historico_status.length} mudanças` : '-'}</p></div>
        </CardContent>
      </Card>

      {/* TRACKING DETALHADO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Tracking Detalhado
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><Label>Tracking History</Label><p>{devolucao.tracking_history && Array.isArray(devolucao.tracking_history) ? `${devolucao.tracking_history.length} registros` : '-'}</p></div>
          <div><Label>Tracking Events</Label><p>{devolucao.tracking_events && Array.isArray(devolucao.tracking_events) ? `${devolucao.tracking_events.length} eventos` : '-'}</p></div>
          <div><Label>Shipment Delays</Label><p>{devolucao.shipment_delays && Array.isArray(devolucao.shipment_delays) ? `${devolucao.shipment_delays.length} atrasos` : '-'}</p></div>
          <div><Label>Histórico Localizações</Label><p>{devolucao.historico_localizacoes && Array.isArray(devolucao.historico_localizacoes) ? `${devolucao.historico_localizacoes.length} locais` : '-'}</p></div>
        </CardContent>
      </Card>

      {/* DADOS TÉCNICOS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Dados Técnicos e Origem
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><Label>Marketplace Origem</Label><p>{devolucao.marketplace_origem || '-'}</p></div>
          <div><Label>Fonte de Dados</Label><p>{devolucao.fonte_dados_primaria || '-'}</p></div>
          <div><Label>Origem Timeline</Label><p>{devolucao.origem_timeline || '-'}</p></div>
          <div><Label>Último Usuário</Label><p>{devolucao.usuario_ultima_acao || '-'}</p></div>
          <div><Label>Confiabilidade</Label><Badge>{devolucao.confiabilidade_dados || '-'}</Badge></div>
          <div><Label>Versão API</Label><p className="font-mono text-sm">{devolucao.versao_api_utilizada || '-'}</p></div>
          <div><Label>Hash Verificação</Label><p className="font-mono text-xs truncate" title={devolucao.hash_verificacao}>{devolucao.hash_verificacao || '-'}</p></div>
        </CardContent>
      </Card>

      {/* TEMPOS ADICIONAIS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Métricas Temporais Detalhadas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><Label>Resposta Comprador</Label><p>{devolucao.tempo_resposta_comprador ? `${devolucao.tempo_resposta_comprador} min` : '-'}</p></div>
          <div><Label>Análise ML</Label><p>{devolucao.tempo_analise_ml ? `${devolucao.tempo_analise_ml} min` : '-'}</p></div>
          <div><Label>Data 1ª Ação</Label><p>{devolucao.data_primeira_acao ? new Date(devolucao.data_primeira_acao).toLocaleDateString('pt-BR') : '-'}</p></div>
          <div><Label>Tempo Limite Ação</Label><p>{devolucao.tempo_limite_acao ? new Date(devolucao.tempo_limite_acao).toLocaleDateString('pt-BR') : '-'}</p></div>
        </CardContent>
      </Card>

      {/* TROCA E PRODUTO NOVO */}
      {devolucao.eh_troca && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informações de Troca
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><Label>Valor Diferença</Label><p className="font-semibold text-green-600">{devolucao.valor_diferenca_troca ? `R$ ${devolucao.valor_diferenca_troca.toFixed(2)}` : '-'}</p></div>
            <div><Label>Produto Troca ID</Label><p className="font-mono text-sm">{devolucao.produto_troca_id || '-'}</p></div>
            <div><Label>Status Produto Novo</Label><Badge>{devolucao.status_produto_novo || '-'}</Badge></div>
          </CardContent>
        </Card>
      )}

      {/* REVIEW DETALHADO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalhes de Review
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><Label>Ações Necessárias</Label><p>{devolucao.acoes_necessarias_review && Array.isArray(devolucao.acoes_necessarias_review) ? `${devolucao.acoes_necessarias_review.length} ações` : '-'}</p></div>
          <div><Label>Início Review</Label><p>{devolucao.data_inicio_review ? new Date(devolucao.data_inicio_review).toLocaleDateString('pt-BR') : '-'}</p></div>
          <div><Label>Observações Review</Label><p className="text-sm">{devolucao.observacoes_review || '-'}</p></div>
        </CardContent>
      </Card>
    </div>
  );
};