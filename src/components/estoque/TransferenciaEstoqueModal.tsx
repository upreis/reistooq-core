import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LocalEstoque } from '@/features/estoque/types/locais.types';
import { Product } from '@/hooks/useProducts';
import { Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TransferenciaEstoqueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: string[];
  allProducts: Product[];
  localOrigemId: string;
  localOrigemNome: string;
  onSuccess: () => void;
}

interface TransferenciaItem {
  produtoId: string;
  sku: string;
  nome: string;
  quantidadeAtual: number;
  quantidadeTransferir: number;
  erro?: string;
}

const TIPO_ICONS: Record<string, string> = {
  principal: '🏢',
  fullfilment_ml: '📦',
  fullfilment_shopee: '🛍️',
  filial: '🏪',
  outro: '📍'
};

export function TransferenciaEstoqueModal({
  open,
  onOpenChange,
  selectedProducts,
  allProducts,
  localOrigemId,
  localOrigemNome,
  onSuccess
}: TransferenciaEstoqueModalProps) {
  const [locaisDestino, setLocaisDestino] = useState<LocalEstoque[]>([]);
  const [localDestinoId, setLocalDestinoId] = useState<string>('');
  const [transferencias, setTransferencias] = useState<TransferenciaItem[]>([]);
  const [idEnvio, setIdEnvio] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [carregandoLocais, setCarregandoLocais] = useState(false);
  const { toast } = useToast();

  // Carregar locais de destino (todos exceto o atual)
  useEffect(() => {
    if (open && localOrigemId) {
      carregarLocaisDestino();
      inicializarTransferencias();
    }
  }, [open, localOrigemId, selectedProducts]);

  const carregarLocaisDestino = async () => {
    setCarregandoLocais(true);
    try {
      const { data, error } = await supabase
        .from('locais_estoque')
        .select('*')
        .eq('ativo', true)
        .neq('id', localOrigemId)
        .order('nome', { ascending: true });

      if (error) throw error;

      setLocaisDestino((data || []) as LocalEstoque[]);
    } catch (error) {
      console.error('Erro ao carregar locais:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os locais de destino.',
        variant: 'destructive'
      });
    } finally {
      setCarregandoLocais(false);
    }
  };

  const inicializarTransferencias = () => {
    const items: TransferenciaItem[] = selectedProducts
      .map(id => {
        const produto = allProducts.find(p => p.id === id);
        if (!produto) return null;

        // Filtrar apenas produtos filhos (não produtos pai)
        // Produtos pai têm eh_produto_pai = true, filhos têm sku_pai preenchido
        if (produto.eh_produto_pai === true) return null;

        return {
          produtoId: produto.id,
          sku: produto.sku_interno,
          nome: produto.nome,
          quantidadeAtual: produto.quantidade_atual || 0,
          quantidadeTransferir: 0
        };
      })
      .filter((item): item is TransferenciaItem => item !== null);

    setTransferencias(items);
  };

  const atualizarQuantidade = (produtoId: string, quantidade: string) => {
    const qtd = parseInt(quantidade) || 0;
    
    setTransferencias(prev => prev.map(item => {
      if (item.produtoId === produtoId) {
        const erro = qtd > item.quantidadeAtual 
          ? 'Quantidade maior que disponível'
          : qtd <= 0 
            ? 'Quantidade deve ser maior que zero'
            : undefined;

        return { ...item, quantidadeTransferir: qtd, erro };
      }
      return item;
    }));
  };

  const validarTransferencias = (): boolean => {
    if (!localDestinoId) {
      toast({
        title: 'Local de destino não selecionado',
        description: 'Selecione um local de destino para a transferência.',
        variant: 'destructive'
      });
      return false;
    }

    const comQuantidade = transferencias.filter(t => t.quantidadeTransferir > 0);
    
    if (comQuantidade.length === 0) {
      toast({
        title: 'Nenhuma quantidade informada',
        description: 'Informe a quantidade a transferir para pelo menos um produto.',
        variant: 'destructive'
      });
      return false;
    }

    const comErro = transferencias.filter(t => t.erro && t.quantidadeTransferir > 0);
    
    if (comErro.length > 0) {
      toast({
        title: 'Quantidades inválidas',
        description: 'Corrija as quantidades com erro antes de continuar.',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const executarTransferencias = async () => {
    if (!validarTransferencias()) return;

    setLoading(true);

    try {
      const transferenciasValidas = transferencias.filter(t => t.quantidadeTransferir > 0);
      
      for (const item of transferenciasValidas) {
        // 1. Buscar estoque atual no local de origem
        const { data: estoqueOrigem, error: errorOrigem } = await supabase
          .from('estoque_por_local')
          .select('quantidade')
          .eq('produto_id', item.produtoId)
          .eq('local_id', localOrigemId)
          .single();

        if (errorOrigem) throw errorOrigem;

        const novaQuantidadeOrigem = (estoqueOrigem?.quantidade || 0) - item.quantidadeTransferir;

        // 2. Atualizar quantidade no local de origem
        const { error: errorAtualizarOrigem } = await supabase
          .from('estoque_por_local')
          .update({ quantidade: novaQuantidadeOrigem })
          .eq('produto_id', item.produtoId)
          .eq('local_id', localOrigemId);

        if (errorAtualizarOrigem) throw errorAtualizarOrigem;

        // 3. Verificar se existe estoque no local de destino
        const { data: estoqueDestino, error: errorBuscarDestino } = await supabase
          .from('estoque_por_local')
          .select('quantidade')
          .eq('produto_id', item.produtoId)
          .eq('local_id', localDestinoId)
          .maybeSingle();

        if (errorBuscarDestino) throw errorBuscarDestino;

        if (estoqueDestino) {
          // Atualizar quantidade existente
          const novaQuantidadeDestino = (estoqueDestino.quantidade || 0) + item.quantidadeTransferir;
          
          const { error: errorAtualizarDestino } = await supabase
            .from('estoque_por_local')
            .update({ quantidade: novaQuantidadeDestino })
            .eq('produto_id', item.produtoId)
            .eq('local_id', localDestinoId);

          if (errorAtualizarDestino) throw errorAtualizarDestino;
        } else {
          // Criar novo registro - buscar organization_id via RPC
          const { data: orgId } = await supabase.rpc('get_current_org_id');
          
          let organizationId = orgId;
          
          // Fallback: buscar de um produto existente
          if (!organizationId) {
            const { data: produtoData } = await supabase
              .from('produtos')
              .select('organization_id')
              .eq('id', item.produtoId)
              .single();
            
            organizationId = produtoData?.organization_id;
          }
          
          if (!organizationId) {
            throw new Error('Não foi possível obter o ID da organização');
          }
          
          const { error: errorCriarDestino } = await supabase
            .from('estoque_por_local')
            .insert([{
              produto_id: item.produtoId,
              local_id: localDestinoId,
              quantidade: item.quantidadeTransferir,
              organization_id: organizationId
            }]);

          if (errorCriarDestino) throw errorCriarDestino;
        }

        // 4. Registrar movimentação de saída no local origem
        await supabase.from('movimentacoes_estoque').insert([{
          produto_id: item.produtoId,
          tipo_movimentacao: 'saida',
          quantidade_movimentada: item.quantidadeTransferir,
          quantidade_anterior: item.quantidadeAtual,
          quantidade_nova: novaQuantidadeOrigem,
          motivo: `Transferência para ${locaisDestino.find(l => l.id === localDestinoId)?.nome}`,
          local_id: localOrigemId
        }]);

        // 5. Registrar movimentação de entrada no local destino
        const quantidadeDestinoAtual = estoqueDestino?.quantidade || 0;
        await supabase.from('movimentacoes_estoque').insert([{
          produto_id: item.produtoId,
          tipo_movimentacao: 'entrada',
          quantidade_movimentada: item.quantidadeTransferir,
          quantidade_anterior: quantidadeDestinoAtual,
          quantidade_nova: quantidadeDestinoAtual + item.quantidadeTransferir,
          motivo: `Transferência de ${localOrigemNome}`,
          local_id: localDestinoId
        }]);

        // 6. Produto atualizado com sucesso via estoque_por_local
        console.log(`✅ Transferência concluída: ${item.nome}`);
      }

      toast({
        title: 'Transferência concluída',
        description: `${transferenciasValidas.length} ${transferenciasValidas.length === 1 ? 'produto transferido' : 'produtos transferidos'} com sucesso.`
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao executar transferências:', error);
      toast({
        title: 'Erro na transferência',
        description: 'Ocorreu um erro ao transferir os produtos. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const localDestino = locaisDestino.find(l => l.id === localDestinoId);
  
  // Calcular resumo de quantidades
  const totalItens = transferencias.filter(t => t.quantidadeTransferir > 0).length;
  const totalQuantidade = transferencias.reduce((sum, t) => sum + t.quantidadeTransferir, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transferir Estoque</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informação do local de origem */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Local de Origem:</strong> {localOrigemNome}
            </AlertDescription>
          </Alert>

          {/* Seletor de local de destino */}
          <div className="space-y-2">
            <Label>Local de Destino</Label>
            <Select value={localDestinoId} onValueChange={setLocalDestinoId} disabled={carregandoLocais}>
              <SelectTrigger>
                <SelectValue placeholder={carregandoLocais ? "Carregando..." : "Selecione o local de destino"} />
              </SelectTrigger>
              <SelectContent>
                {locaisDestino.map(local => (
                  <SelectItem key={local.id} value={local.id}>
                    <span className="flex items-center gap-2">
                      <span>{TIPO_ICONS[local.tipo] || '📍'}</span>
                      <span>{local.nome}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campo de ID do Envio */}
          <div className="space-y-2">
            <Label htmlFor="id-envio">ID do Envio (opcional)</Label>
            <Input
              id="id-envio"
              type="text"
              value={idEnvio}
              onChange={(e) => setIdEnvio(e.target.value)}
              placeholder="Ex: ENV-2024-001"
            />
          </div>

          {/* Lista de produtos para transferir */}
          {transferencias.length > 0 && (
            <div className="space-y-3">
              <Label>Produtos a Transferir ({transferencias.length})</Label>
              <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                {transferencias.map(item => (
                  <div key={item.produtoId} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.nome}</p>
                        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                        <p className="text-sm text-muted-foreground">Disponível: {item.quantidadeAtual}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-24">
                          <Input
                            type="number"
                            min="0"
                            max={item.quantidadeAtual}
                            value={item.quantidadeTransferir || ''}
                            onChange={(e) => atualizarQuantidade(item.produtoId, e.target.value)}
                            placeholder="Qtd"
                            className={item.erro ? 'border-destructive' : ''}
                          />
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className="w-20 text-right">
                          <span className="text-sm font-medium">
                            {localDestino ? TIPO_ICONS[localDestino.tipo] || '📍' : '?'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {item.erro && (
                      <p className="text-sm text-destructive">{item.erro}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {transferencias.length === 0 && (
            <Alert>
              <AlertDescription>
                Nenhum produto selecionado para transferência.
              </AlertDescription>
            </Alert>
          )}

          {/* Resumo da transferência */}
          {totalItens > 0 && (
            <Alert className="bg-primary/10 border-primary/20">
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold">Resumo da Transferência:</p>
                  <p className="text-sm">
                    • <strong>{totalItens}</strong> {totalItens === 1 ? 'item' : 'itens'} a transferir
                  </p>
                  <p className="text-sm">
                    • <strong>{totalQuantidade}</strong> {totalQuantidade === 1 ? 'unidade' : 'unidades'} no total
                  </p>
                  {idEnvio && (
                    <p className="text-sm">
                      • ID do Envio: <strong>{idEnvio}</strong>
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={executarTransferencias} disabled={loading || transferencias.length === 0}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Transferindo...
              </>
            ) : (
              'Confirmar Transferência'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
