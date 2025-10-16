import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';
import { TimelineTab } from './tabs/TimelineTab';
import { MotivoTab } from './tabs/MotivoTab';
import { MediacaoTab } from './tabs/MediacaoTab';
import { RastreamentoTab } from './tabs/RastreamentoTab';
import { FinanceiroTab } from './tabs/FinanceiroTab';
import { DetalhesTecnicosTab } from './tabs/DetalhesTecnicosTab';

interface DevolucaoDetailsDialogProps {
  devolucao: DevolucaoAvancada | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DevolucaoDetailsDialog: React.FC<DevolucaoDetailsDialogProps> = ({
  devolucao,
  open,
  onOpenChange,
}) => {
  if (!devolucao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Detalhes da Devolução - {devolucao.claim_id || devolucao.order_id}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="motivo">Motivo</TabsTrigger>
            <TabsTrigger value="mediacao">Mediação</TabsTrigger>
            <TabsTrigger value="rastreamento">Rastreamento</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4 mt-4">
            <TimelineTab devolucao={devolucao} />
          </TabsContent>

          <TabsContent value="motivo" className="space-y-4 mt-4">
            <MotivoTab devolucao={devolucao} />
          </TabsContent>

          <TabsContent value="mediacao" className="space-y-4 mt-4">
            <MediacaoTab devolucao={devolucao} />
          </TabsContent>

          <TabsContent value="rastreamento" className="space-y-4 mt-4">
            <RastreamentoTab devolucao={devolucao} />
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-4 mt-4">
            <FinanceiroTab devolucao={devolucao} />
          </TabsContent>

          <TabsContent value="detalhes" className="space-y-4 mt-4">
            <DetalhesTecnicosTab devolucao={devolucao} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
