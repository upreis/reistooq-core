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
import { ReclamacoesMensagensTab } from './tabs/ReclamacoesMensagensTab';
import { ReclamacoesResolucaoTab } from './tabs/ReclamacoesResolucaoTab';
import { ReclamacoesTrocasTab } from './tabs/ReclamacoesTrocasTab';

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
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="mensagens" disabled={!claim.tem_mensagens}>
              Mensagens
              {claim.total_mensagens > 0 && (
                <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5">
                  {claim.total_mensagens}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="trocas" disabled={!claim.tem_trocas}>
              Trocas
              {claim.total_trocas > 0 && (
                <span className="ml-1 text-xs bg-green-500 text-white rounded-full px-1.5">
                  {claim.total_trocas}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="resolucao" disabled={!claim.resolution_type}>
              Resolução
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="mt-6">
            <ReclamacoesGeralTab claim={claim} />
          </TabsContent>

          <TabsContent value="mensagens" className="mt-6">
            <ReclamacoesMensagensTab 
              claimId={claim.claim_id} 
              accountId={claim.integration_account_id}
            />
          </TabsContent>

          <TabsContent value="trocas" className="mt-6">
            <ReclamacoesTrocasTab claim={claim} />
          </TabsContent>

          <TabsContent value="resolucao" className="mt-6">
            <ReclamacoesResolucaoTab claim={claim} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
