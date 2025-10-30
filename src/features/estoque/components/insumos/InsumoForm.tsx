/**
 * 📝 FORMULÁRIO - CADASTRO DE INSUMO
 * Form para adicionar/editar insumos
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
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

  const insumoSelecionado = insumos.find(i => i.sku === form.watch('sku_insumo'));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {insumo ? 'Editar Insumo' : 'Novo Insumo'}
          </DialogTitle>
          <DialogDescription>
            Insumos são debitados <strong>1 vez por pedido</strong>, independente da quantidade.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* SKU Produto */}
            <FormField
              control={form.control}
              name="sku_produto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produto</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!!insumo || loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {produtos.map(p => (
                        <SelectItem key={p.sku} value={p.sku}>
                          <span className="font-mono text-sm">{p.sku}</span>
                          <span className="text-muted-foreground ml-2">- {p.nome}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Produto que utilizará este insumo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SKU Insumo */}
            <FormField
              control={form.control}
              name="sku_insumo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Insumo</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!!insumo || loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o insumo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {insumos.map(i => (
                        <SelectItem key={i.sku} value={i.sku}>
                          <div className="flex items-center justify-between w-full gap-4">
                            <div>
                              <span className="font-mono text-sm">{i.sku}</span>
                              <span className="text-muted-foreground ml-2">- {i.nome}</span>
                            </div>
                            <Badge 
                              variant={i.estoque > 0 ? 'default' : 'destructive'}
                              className={i.estoque > 0 ? 'bg-green-500' : ''}
                            >
                              Est: {i.estoque}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Etiqueta, embalagem ou outro material consumível
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Estoque disponível */}
            {insumoSelecionado && (
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="text-sm">
                  <strong>Estoque disponível:</strong>{' '}
                  <Badge 
                    variant={insumoSelecionado.estoque > 0 ? 'default' : 'destructive'}
                    className={insumoSelecionado.estoque > 0 ? 'bg-green-500' : ''}
                  >
                    {insumoSelecionado.estoque} unidades
                  </Badge>
                </div>
              </div>
            )}

            {/* Quantidade */}
            <FormField
              control={form.control}
              name="quantidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade por Pedido</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      className="max-w-xs"
                    />
                  </FormControl>
                  <FormDescription>
                    Quantidade fixa de insumo por pedido (padrão: 1)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {insumo ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
