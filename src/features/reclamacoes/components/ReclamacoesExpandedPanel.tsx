/**
 * 📋 PAINEL EXPANDIDO DE RECLAMAÇÕES
 * FASE 3: Layout de abas com detalhes completos
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ReclamacoesGeralTab } from './tabs/ReclamacoesGeralTab';

interface ReclamacoesExpandedPanelProps {
  claim: any;
  onClose: () => void;
}

export function ReclamacoesExpandedPanel({ claim, onClose }: ReclamacoesExpandedPanelProps) {
  const [activeTab, setActiveTab] = useState('geral');

  return (
    <Card className="mt-4 border-2 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-xl">
          Detalhes da Reclamação #{claim.claim_id}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="mensagens" disabled>
              Mensagens (Em breve)
            </TabsTrigger>
            <TabsTrigger value="resolucao" disabled>
              Resolução (Em breve)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="mt-6">
            <ReclamacoesGeralTab claim={claim} />
          </TabsContent>

          <TabsContent value="mensagens" className="mt-6">
            <div className="text-center text-muted-foreground py-8">
              Funcionalidade disponível na próxima versão
            </div>
          </TabsContent>

          <TabsContent value="resolucao" className="mt-6">
            <div className="text-center text-muted-foreground py-8">
              Funcionalidade disponível na próxima versão
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
