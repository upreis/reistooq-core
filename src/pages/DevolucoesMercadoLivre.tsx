/**
 * 📦 DEVOLUÇÕES ML - NOVA VERSÃO LIMPA
 * Reconstruída do zero seguindo padrão de /reclamacoes
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

interface MLAccount {
  id: string;
  name: string;
}

interface Devolucao {
  id: string;
  claim_id: string;
  status: any;
  comprador_nome_completo: string;
  produto_titulo: string;
  valor_reembolso_total: number;
  data_criacao: string;
  empresa: string;
}

export default function DevolucoesMercadoLivre() {
  const [accounts, setAccounts] = useState<MLAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [periodo, setPeriodo] = useState('60');
  const [devolucoes, setDevolucoes] = useState<Devolucao[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar contas ML
  useEffect(() => {
    const fetchAccounts = async () => {
      console.log('🔍 Buscando contas ML...');
      const { data, error } = await supabase
        .from('integration_accounts')
        .select('id, name')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar contas:', error);
        toast.error('Erro ao carregar contas ML');
        return;
      }

      console.log('✅ Contas encontradas:', data?.length || 0);
      setAccounts(data || []);
      
      if (data && data.length > 0) {
        setSelectedAccountId(data[0].id);
        console.log('✅ Auto-selecionada conta:', data[0].name);
      }
    };

    fetchAccounts();
  }, []);

  // Buscar devoluções da API ML
  const handleBuscar = async () => {
    if (!selectedAccountId) {
      toast.error('Selecione uma conta ML');
      return;
    }

    console.log('📡 Iniciando busca de devoluções...');
    console.log('📍 Conta:', selectedAccountId);
    console.log('📍 Período:', periodo);

    setIsLoading(true);
    const toastId = toast.loading(`📡 Buscando devoluções dos últimos ${periodo} dias...`);

    try {
      // Calcular datas
      const dateTo = new Date();
      const dateFrom = new Date();
      dateFrom.setDate(dateTo.getDate() - parseInt(periodo));

      const dateFromISO = dateFrom.toISOString();
      const dateToISO = dateTo.toISOString();

      console.log('📅 Date from:', dateFromISO);
      console.log('📅 Date to:', dateToISO);

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke('get-devolucoes-direct', {
        body: {
          integration_account_id: selectedAccountId,
          date_from: dateFromISO,
          date_to: dateToISO
        }
      });

      if (error) {
        console.error('❌ Erro na Edge Function:', error);
        toast.error('Erro ao buscar devoluções', { id: toastId });
        return;
      }

      // A Edge Function retorna { success, data, total }
      const claimsArray = data?.data || [];
      console.log('✅ Dados recebidos:', claimsArray.length, 'devoluções');
      
      // Adicionar nome da empresa
      const account = accounts.find(acc => acc.id === selectedAccountId);
      const devolucoesComEmpresa = claimsArray.map((dev: any) => ({
        ...dev,
        empresa: account?.name || 'N/A'
      }));

      setDevolucoes(devolucoesComEmpresa);
      toast.success(`✅ ${devolucoesComEmpresa.length} devoluções encontradas`, { id: toastId });

    } catch (err) {
      console.error('❌ Erro ao buscar:', err);
      toast.error('Erro ao buscar devoluções', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MLOrdersNav />
      
      <div className="container mx-auto py-6 space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">Devoluções Mercado Livre</h1>
          <p className="text-muted-foreground">Gerencie suas devoluções do Mercado Livre</p>
        </div>

        {/* FILTROS */}
        <Card className="p-6">
          <div className="flex gap-4 items-end">
            {/* Conta ML */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Conta ML</label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="15">Últimos 15 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="60">Últimos 60 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botão Buscar */}
            <Button 
              onClick={handleBuscar} 
              disabled={isLoading || !selectedAccountId}
              className="px-8"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                'Buscar Devoluções'
              )}
            </Button>
          </div>
        </Card>

        {/* TABELA */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Claim ID</TableHead>
                <TableHead>Comprador</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : devolucoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Clique em "Buscar Devoluções" para carregar os dados
                  </TableCell>
                </TableRow>
              ) : (
                devolucoes.map((dev) => (
                  <TableRow key={dev.id}>
                    <TableCell className="font-medium">{dev.empresa}</TableCell>
                    <TableCell>{dev.claim_id}</TableCell>
                    <TableCell>{dev.comprador_nome_completo || '-'}</TableCell>
                    <TableCell className="text-xs">
                      {dev.comprador_cpf || dev.dados_buyer_info?.doc_number || '-'}
                    </TableCell>
                    <TableCell>{dev.produto_titulo || '-'}</TableCell>
                    <TableCell>
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                        {dev.status?.id || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {dev.metodo_pagamento || dev.dados_financial_info?.payment_method || '-'}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {dev.codigo_rastreamento || dev.dados_tracking_info?.tracking_number || '-'}
                    </TableCell>
                    <TableCell>
                      {dev.valor_reembolso_total 
                        ? `R$ ${dev.valor_reembolso_total.toFixed(2)}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {dev.data_criacao 
                        ? new Date(dev.data_criacao).toLocaleDateString('pt-BR')
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {devolucoes.length > 0 && (
            <div className="p-4 border-t text-sm text-muted-foreground">
              Total: {devolucoes.length} devoluções
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
