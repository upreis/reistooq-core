/**
 * 📝 FORMULÁRIO - CADASTRO DE INSUMO
 * Form para adicionar/editar insumos
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Package, Plus, Trash2, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { ComposicaoInsumoEnriquecida } from '../../types/insumos.types';

const schema = z.object({
  sku_produto: z.string().min(1, 'Selecione um produto'),
  sku_insumo: z.string().min(1, 'Selecione um insumo'),
  quantidade: z.number().int().min(1, 'Quantidade deve ser no mínimo 1').default(1),
  observacoes: z.string().optional()
});

type FormData = z.infer<typeof schema>;

interface InsumoFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  insumo?: ComposicaoInsumoEnriquecida | null;
}

export function InsumoForm({ open, onClose, onSubmit, insumo }: InsumoFormProps) {
  const [produtos, setProdutos] = useState<Array<{ sku: string; nome: string }>>([]);
  const [insumos, setInsumos] = useState<Array<{ sku: string; nome: string; estoque: number }>>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      sku_produto: '',
      sku_insumo: '',
      quantidade: 1,
      observacoes: ''
    }
  });

  // Carregar produtos e insumos
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  // Preencher form se estiver editando
  useEffect(() => {
    if (insumo) {
      form.reset({
        sku_produto: insumo.sku_produto,
        sku_insumo: insumo.sku_insumo,
        quantidade: insumo.quantidade,
        observacoes: insumo.observacoes || ''
      });
    } else {
      form.reset({
        sku_produto: '',
        sku_insumo: '',
        quantidade: 1,
        observacoes: ''
      });
    }
  }, [insumo, form]);

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

  const handleSubmit = async (data: FormData) => {
    await onSubmit(data);
    onClose();
  };


  const produtoSelecionado = produtos.find(p => p.sku === form.watch('sku_produto'));
  const insumoSelecionado = insumos.find(i => i.sku === form.watch('sku_insumo'));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {insumo ? 'Editar Composições' : 'Editar Composições'} - {insumo ? 'Nova Composição' : 'Nova Composição'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Insumos são debitados 1 vez por pedido, independente da quantidade.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                  <FormField
                    control={form.control}
                    name="sku_produto"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="text-sm font-medium">SKU do Produto</Label>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!!insumo || loading}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione o produto..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {produtos.map(p => (
                              <SelectItem key={p.sku} value={p.sku}>
                                {p.sku}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Nome do Produto */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nome do Produto</Label>
                    <Input
                      value={produtoSelecionado?.nome || ''}
                      disabled
                      placeholder="Selecione um produto..."
                      className="w-full bg-muted"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Componentes da Composição */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Componentes da Composição</h3>
              </div>

              {/* Botão adicionar componente */}
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={() => {/* placeholder - sempre um único insumo */}}
                disabled
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Componente
              </Button>

              {/* Lista de componentes */}
              <div className="space-y-3">
                <Card className="border-border/50">
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* SKU Insumo */}
                      <div className="lg:col-span-4">
                        <FormField
                          control={form.control}
                          name="sku_insumo"
                          render={({ field }) => (
                            <FormItem>
                              <Label className="text-sm font-medium">SKU</Label>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={!!insumo || loading}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Buscar SKU..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {insumos.map(i => (
                                    <SelectItem key={i.sku} value={i.sku}>
                                      {i.sku}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Nome do Insumo */}
                      <div className="lg:col-span-4">
                        <Label className="text-sm font-medium">Nome do Componente</Label>
                        <Input
                          value={insumoSelecionado?.nome || ''}
                          disabled
                          placeholder="Selecione um insumo..."
                          className="bg-muted"
                        />
                      </div>

                      {/* Estoque */}
                      <div className="lg:col-span-2">
                        <Label className="text-sm font-medium">Custo Uni</Label>
                        <div className="flex items-center h-10">
                          {insumoSelecionado && (
                            <Badge 
                              variant={insumoSelecionado.estoque > 0 ? 'default' : 'destructive'}
                              className={insumoSelecionado.estoque > 0 ? 'bg-green-500 hover:bg-green-600' : ''}
                            >
                              {insumoSelecionado.estoque}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Quantidade */}
                      <div className="lg:col-span-2">
                        <FormField
                          control={form.control}
                          name="quantidade"
                          render={({ field }) => (
                            <FormItem>
                              <Label className="text-sm font-medium">Qtd</Label>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Observações */}
                    <FormField
                      control={form.control}
                      name="observacoes"
                      render={({ field }) => (
                        <FormItem>
                          <Label className="text-sm font-medium">Observações (opcional)</Label>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Informações adicionais sobre este insumo..."
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Footer com botões */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {insumo ? 'Salvar Composições' : 'Salvar Composições'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
