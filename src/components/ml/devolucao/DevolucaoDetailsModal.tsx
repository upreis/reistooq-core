import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import TimelineVisualization from '@/components/ml/TimelineVisualization';
import { FinancialDetailsTab } from './tabs/FinancialDetailsTab';
import { ReputationTab } from './tabs/ReputationTab';
import { TrackingTab } from './tabs/TrackingTab';
import { AttachmentsTab } from './tabs/AttachmentsTab';
import { MediationTab } from './tabs/MediationTab';
import { ReviewsTab } from './tabs/ReviewsTab';
import { SLAMetricsTab } from './tabs/SLAMetricsTab';
import { AdvancedDataTab } from './tabs/AdvancedDataTab';
import { BuyerPaymentTab } from './tabs/BuyerPaymentTab';
import { ProductQualityTab } from './tabs/ProductQualityTab';
import { 
  Package, FileText, CheckCircle, DollarSign, 
  Truck, Star, Scale, 
  Paperclip, TrendingUp, FileCheck, Database, Clock
} from 'lucide-react';
import { 
  extractCancelReason, extractDetailedReason, formatCurrency, formatDate
} from '@/features/devolucoes/utils/extractDevolucaoData';

interface DevolucaoDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devolucao: any | null;
}

export const DevolucaoDetailsModal: React.FC<DevolucaoDetailsModalProps> = ({
  open, onOpenChange, devolucao
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!devolucao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes Completos - Order {devolucao.order_id}
            <Badge variant="outline" className="ml-2">
              {devolucao.dados_completos ? 'Dados Completos' : 'Dados Parciais'}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-12 w-full">
            <TabsTrigger value="overview"><Package className="h-4 w-4 mr-1" />Geral</TabsTrigger>
            <TabsTrigger value="financial"><DollarSign className="h-4 w-4 mr-1" />Financeiro</TabsTrigger>
            <TabsTrigger value="buyer">👤 Comprador</TabsTrigger>
            <TabsTrigger value="product">📦 Produto</TabsTrigger>
            <TabsTrigger value="tracking"><Truck className="h-4 w-4 mr-1" />Rastreio</TabsTrigger>
            <TabsTrigger value="reviews"><FileCheck className="h-4 w-4 mr-1" />Reviews</TabsTrigger>
            <TabsTrigger value="sla"><Clock className="h-4 w-4 mr-1" />SLA</TabsTrigger>
            <TabsTrigger value="mediation"><Scale className="h-4 w-4 mr-1" />Mediação</TabsTrigger>
            <TabsTrigger value="reputation"><Star className="h-4 w-4 mr-1" />Reputação</TabsTrigger>
            <TabsTrigger value="attachments">
              <Paperclip className="h-4 w-4 mr-1" />Anexos
              {devolucao.anexos_count > 0 && <Badge variant="secondary" className="ml-1">{devolucao.anexos_count}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="timeline"><TrendingUp className="h-4 w-4 mr-1" />Timeline</TabsTrigger>
            <TabsTrigger value="advanced"><Database className="h-4 w-4 mr-1" />Avançados</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="overview" className="mt-0 space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Informações Básicas</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div><Label className="text-sm text-gray-500 dark:text-gray-400">Order ID</Label>
                        <p className="font-medium text-lg dark:text-white">{devolucao.order_id}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <div><Label className="text-sm text-gray-500 dark:text-gray-400">Claim ID</Label>
                        <p className="font-medium dark:text-white">{devolucao.claim_id || 'N/A'}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div><Label className="text-sm text-gray-500 dark:text-gray-400">Status</Label>
                        <Badge variant={devolucao.status_devolucao === 'completed' ? 'default' : devolucao.status_devolucao === 'cancelled' ? 'destructive' : 'secondary'}>
                          {devolucao.status_devolucao}
                        </Badge></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div><Label className="text-sm text-muted-foreground">Valor Retido</Label>
                        <p className="font-medium text-lg text-green-600 dark:text-green-400">{formatCurrency(devolucao.valor_retido)}</p></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial" className="mt-0"><FinancialDetailsTab devolucao={devolucao} /></TabsContent>
            <TabsContent value="buyer" className="mt-0"><BuyerPaymentTab devolucao={devolucao} /></TabsContent>
            <TabsContent value="product" className="mt-0"><ProductQualityTab devolucao={devolucao} /></TabsContent>
            <TabsContent value="tracking" className="mt-0"><TrackingTab devolucao={devolucao} /></TabsContent>
            <TabsContent value="reviews" className="mt-0"><ReviewsTab devolucao={devolucao} /></TabsContent>
            <TabsContent value="sla" className="mt-0"><SLAMetricsTab devolucao={devolucao} /></TabsContent>
            <TabsContent value="mediation" className="mt-0"><MediationTab devolucao={devolucao} /></TabsContent>
            <TabsContent value="reputation" className="mt-0"><ReputationTab devolucao={devolucao} /></TabsContent>
            <TabsContent value="attachments" className="mt-0"><AttachmentsTab devolucao={devolucao} /></TabsContent>
            <TabsContent value="timeline" className="mt-0">
              <TimelineVisualization 
                timelineData={{
                  timeline_events: devolucao.timeline_events || [],
                  timeline_consolidado: devolucao.timeline_consolidado,
                  metricas_temporais: devolucao.metricas_temporais
                }} 
              />
            </TabsContent>
            <TabsContent value="advanced" className="mt-0"><AdvancedDataTab devolucao={devolucao} /></TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
