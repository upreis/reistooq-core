/**
 * 📝 FORMULÁRIO - CADASTRO DE INSUMO
 * Form para adicionar/editar insumos
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Package, Plus, Trash2, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { ComposicaoInsumoEnriquecida } from '../../types/insumos.types';

interface ComposicaoForm {
  id?: string;
  sku_insumo: string;
  nome_insumo: string;
  quantidade: number;
  estoque_disponivel?: number;
  observacoes?: string;
}

interface InsumoFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  insumo?: ComposicaoInsumoEnriquecida | null;
}

export function InsumoForm({ open, onClose, onSubmit, insumo }: InsumoFormProps) {
  const [produtos, setProdutos] = useState<Array<{ sku: string; nome: string }>>([]);
  const [insumos, setInsumos] = useState<Array<{ sku: string; nome: string; estoque: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formComposicoes, setFormComposicoes] = useState<ComposicaoForm[]>([]);
  
  // Estados para o produto principal
  const [produtoSku, setProdutoSku] = useState("");
  const [produtoNome, setProdutoNome] = useState("");

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  // Carregar dados do insumo quando estiver em modo edição
  useEffect(() => {
    const loadInsumoData = async () => {
      if (open && insumo) {
        // Modo edição: carregar produto e seus insumos existentes
        setProdutoSku(insumo.sku_produto);
        const produtoEncontrado = produtos.find(p => p.sku === insumo.sku_produto);
        setProdutoNome(produtoEncontrado?.nome || insumo.nome_produto || '');
        
        // Buscar todos os insumos existentes para este produto NO LOCAL ATUAL
        try {
          const { data: insumosExistentes, error } = await supabase
            .from('composicoes_insumos')
            .select('*')
            .eq('sku_produto', insumo.sku_produto)
            .eq('local_id', insumo.local_id); // ✅ CRÍTICO: Filtrar por local!

          if (error) throw error;

          if (insumosExistentes && insumosExistentes.length > 0) {
            // Buscar nomes dos insumos do estoque
            const skusInsumos = insumosExistentes.map(ins => ins.sku_insumo);
            const { data: insumosEstoque } = await supabase
              .from('produtos')
              .select('sku_interno, nome, quantidade_atual')
              .in('sku_interno', skusInsumos);
            
            const nomesInsumos = new Map(
              insumosEstoque?.map(i => [i.sku_interno, { nome: i.nome, estoque: i.quantidade_atual }]) || []
            );

            // Carregar insumos existentes no formulário com nomes
            setFormComposicoes(
              insumosExistentes.map(ins => ({
                id: ins.id,
                sku_insumo: ins.sku_insumo,
                nome_insumo: nomesInsumos.get(ins.sku_insumo)?.nome || ins.sku_insumo,
                quantidade: ins.quantidade,
                estoque_disponivel: nomesInsumos.get(ins.sku_insumo)?.estoque || 0,
                observacoes: ins.observacoes || ''
              }))
            );
          } else {
            // Se não houver insumos, iniciar com um campo vazio
            setFormComposicoes([{
              sku_insumo: '',
              nome_insumo: '',
              quantidade: 1,
              observacoes: ''
            }]);
          }
        } catch (error) {
          console.error('Erro ao carregar insumos existentes:', error);
          setFormComposicoes([{
            sku_insumo: '',
            nome_insumo: '',
            quantidade: 1,
            observacoes: ''
          }]);
        }
      } else if (open && !insumo) {
        // Modo criação: limpar tudo
        setProdutoSku('');
        setProdutoNome('');
        setFormComposicoes([{
          sku_insumo: '',
          nome_insumo: '',
          quantidade: 1,
          observacoes: ''
        }]);
      }
    };

    loadInsumoData();
  }, [open, insumo, produtos]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Buscar produtos (de produtos e produtos_composicoes)
      const [produtosRes, composicoesRes, insumosRes] = await Promise.all([
        supabase.from('produtos').select('sku_interno, nome').eq('ativo', true),
        supabase.from('produtos_composicoes').select('sku_interno, nome').eq('ativo', true),
        supabase.from('produtos').select('sku_interno, nome, quantidade_atual').eq('ativo', true)
      ]);

      // Combinar produtos
      const todosProdutos = [
        ...(produtosRes.data || []).map(p => ({ sku: p.sku_interno, nome: p.nome })),
        ...(composicoesRes.data || []).map(p => ({ sku: p.sku_interno, nome: p.nome }))
      ].sort((a, b) => a.sku.localeCompare(b.sku));

      // Insumos disponíveis
      const todosInsumos = (insumosRes.data || [])
        .map(i => ({ sku: i.sku_interno, nome: i.nome, estoque: i.quantidade_atual }))
        .sort((a, b) => a.sku.localeCompare(b.sku));

      setProdutos(todosProdutos);
      setInsumos(todosInsumos);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const adicionarComposicao = () => {
    setFormComposicoes([
      ...formComposicoes,
      {
        sku_insumo: '',
        nome_insumo: '',
        quantidade: 1,
        observacoes: ''
      }
    ]);
  };

  const removerComposicao = (index: number) => {
    setFormComposicoes(formComposicoes.filter((_, i) => i !== index));
  };

  const atualizarComposicao = (index: number, field: keyof ComposicaoForm, value: any) => {
    setFormComposicoes((prev) => {
      const novasComposicoes = [...prev];
      novasComposicoes[index] = {
        ...novasComposicoes[index],
        [field]: value,
      };
      return novasComposicoes;
    });
  };

  const salvarComposicoes = async () => {
    console.log('🔧 DEBUG - Iniciando salvamento de composições');
    console.log('📦 Produto SKU:', produtoSku);
    console.log('📋 Composições no formulário:', formComposicoes);
    
    // Validar produto
    if (!produtoSku.trim()) {
      console.error('❌ SKU do produto vazio');
      toast.error('Selecione um produto');
      return;
    }

    // Validar componentes
    const composicoesValidas = formComposicoes.filter(comp => 
      comp.sku_insumo.trim() && comp.quantidade > 0
    );

    console.log('✅ Composições válidas:', composicoesValidas);

    if (composicoesValidas.length === 0) {
      console.error('❌ Nenhuma composição válida');
      toast.error('Adicione pelo menos um componente válido');
      return;
    }

    setSaving(true);
    try {
      // ✅ CRÍTICO: Se estiver editando, deletar insumos SOMENTE do local atual
      if (insumo) {
        console.log('🗑️ Deletando insumos existentes para:', {
          sku_produto: produtoSku,
          local_id: insumo.local_id
        });
        
        const { error: deleteError } = await supabase
          .from('composicoes_insumos')
          .delete()
          .eq('sku_produto', produtoSku.trim())
          .eq('local_id', insumo.local_id); // ✅ CRÍTICO: Filtrar por local!

        if (deleteError) {
          console.error('❌ Erro ao deletar insumos existentes:', deleteError);
          throw deleteError;
        }
        console.log('✅ Insumos do local deletados');
      }

      // Salvar cada componente válido
      console.log('💾 Salvando componentes...');
      const promises = composicoesValidas.map((comp, index) => {
        console.log(`📦 Salvando componente ${index + 1}:`, comp);
        return onSubmit({
          sku_produto: produtoSku.trim(),
          sku_insumo: comp.sku_insumo.trim(),
          quantidade: comp.quantidade,
          observacoes: comp.observacoes || null
        });
      });

      await Promise.all(promises);

      console.log('✅ Todos os componentes salvos com sucesso');
      toast.success(`${composicoesValidas.length} insumo(s) salvo(s) com sucesso`);
      onClose();
    } catch (error: any) {
      console.error('❌ Erro ao salvar composições:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast.error(error.message || 'Erro ao salvar composições');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {insumo ? `Editar Composições - ${produtoNome || insumo.sku_produto}` : 'Nova Composição de Insumos'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {insumo 
              ? `Adicione novos insumos para o produto ${insumo.sku_produto}. Insumos são debitados 1x por pedido.`
              : 'Crie uma nova composição de insumos. Insumos são debitados 1x por pedido.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seção de Dados do Produto */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Dados do Produto
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* SKU do Produto */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">SKU do Produto</Label>
                  <Select
                    value={produtoSku}
                    onValueChange={(value) => {
                      setProdutoSku(value);
                      const produto = produtos.find(p => p.sku === value);
                      setProdutoNome(produto?.nome || '');
                    }}
                    disabled={loading || !!insumo}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o produto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.map(p => (
                        <SelectItem key={p.sku} value={p.sku}>
                          {p.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {insumo && (
                    <p className="text-xs text-muted-foreground">
                      Produto bloqueado em modo de edição
                    </p>
                  )}
                </div>

                {/* Nome do Produto */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nome do Produto</Label>
                  <Input
                    value={produtoNome}
                    disabled
                    placeholder="Selecione um produto..."
                    className="w-full bg-muted"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção de Componentes */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Componentes da Composição</h3>
            
            {/* Lista de Composições */}
            <div className="space-y-4">
              {formComposicoes.map((composicao, index) => {
                const insumoSelecionado = insumos.find(i => i.sku === composicao.sku_insumo);
                
                return (
                  <Card key={index} className="group hover:shadow-md transition-all duration-200 border border-border/60 bg-card/50">
                    <CardContent className="p-6">
                      {/* Header com informações principais */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-base">Componente #{index + 1}</h4>
                            <p className="text-sm text-muted-foreground">
                              {composicao.nome_insumo || "Nome não definido"}
                            </p>
                          </div>
                        </div>
                        {formComposicoes.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerComposicao(index)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Informações do SKU em destaque */}
                      {composicao.sku_insumo && (
                        <div className="mb-4 p-3 rounded-lg bg-muted/50 border">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SKU Componente</Label>
                              <p className="text-lg font-mono font-semibold">{composicao.sku_insumo}</p>
                            </div>
                            <div className="text-right">
                              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quantidade</Label>
                              <p className="text-lg font-semibold">
                                {composicao.quantidade} <span className="text-sm text-muted-foreground">un</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Campos de edição */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* SKU do Componente */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">SKU do Componente</Label>
                            <div className="relative">
                              <Input
                                list={`sku-list-${index}`}
                                value={composicao.sku_insumo}
                                onChange={(e) => {
                                  atualizarComposicao(index, 'sku_insumo', e.target.value);
                                  // Auto-completar nome se encontrar insumo
                                  const insumo = insumos.find(i => 
                                    i.sku.toLowerCase() === e.target.value.toLowerCase()
                                  );
                                  if (insumo) {
                                    atualizarComposicao(index, 'nome_insumo', insumo.nome);
                                    atualizarComposicao(index, 'estoque_disponivel', insumo.estoque);
                                  }
                                }}
                                placeholder="Digite ou selecione um SKU..."
                                className="w-full"
                              />
                              <datalist id={`sku-list-${index}`}>
                                {insumos.map((insumo) => (
                                  <option key={insumo.sku} value={insumo.sku}>
                                    {insumo.nome}
                                  </option>
                                ))}
                              </datalist>
                            </div>
                          </div>

                          {/* Nome do Componente */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Nome do Componente</Label>
                            <div className="relative">
                              <Input
                                list={`nome-list-${index}`}
                                value={composicao.nome_insumo}
                                onChange={(e) => {
                                  atualizarComposicao(index, 'nome_insumo', e.target.value);
                                  // Auto-completar SKU se encontrar insumo
                                  const insumo = insumos.find(i => 
                                    i.nome.toLowerCase() === e.target.value.toLowerCase()
                                  );
                                  if (insumo) {
                                    atualizarComposicao(index, 'sku_insumo', insumo.sku);
                                    atualizarComposicao(index, 'estoque_disponivel', insumo.estoque);
                                  }
                                }}
                                placeholder="Digite ou selecione um nome..."
                                className="w-full"
                              />
                              <datalist id={`nome-list-${index}`}>
                                {insumos.map((insumo) => (
                                  <option key={insumo.sku} value={insumo.nome}>
                                    {insumo.sku}
                                  </option>
                                ))}
                              </datalist>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Quantidade</Label>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={composicao.quantidade}
                              onChange={(e) => atualizarComposicao(index, 'quantidade', parseInt(e.target.value) || 1)}
                              className="text-lg font-semibold"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Estoque Disponível</Label>
                            <div className="flex items-center h-10">
                              {insumoSelecionado && (
                                <Badge 
                                  variant={insumoSelecionado.estoque > 0 ? 'default' : 'destructive'}
                                  className={insumoSelecionado.estoque > 0 ? 'bg-green-500 hover:bg-green-600' : ''}
                                >
                                  {insumoSelecionado.estoque} unid.
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Observações */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Observações (opcional)</Label>
                          <Textarea
                            value={composicao.observacoes || ''}
                            onChange={(e) => atualizarComposicao(index, 'observacoes', e.target.value)}
                            placeholder="Informações adicionais sobre este insumo..."
                            rows={2}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Botão Adicionar Componente */}
            <Button
              variant="outline"
              onClick={adicionarComposicao}
              className="w-full mt-4 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-colors"
              disabled={saving}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Componente
            </Button>
          </div>

          {/* Footer com botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={saving}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button 
              onClick={salvarComposicoes}
              disabled={saving || loading}
              className="gap-2 bg-[var(--brand-yellow)] hover:bg-[var(--brand-yellow)]/90 text-[var(--brand-navy)]"
            >
              <Save className="h-4 w-4" />
              {insumo ? 'Adicionar Insumos' : 'Salvar Composições'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}