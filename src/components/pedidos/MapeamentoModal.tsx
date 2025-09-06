/**
 * 🔗 MODAL DE MAPEAMENTO INLINE PARA PÁGINA PEDIDOS
 * Permite criar/editar mapeamentos sem sair da página de pedidos
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, CheckCircle } from 'lucide-react';
import { SkuMapping, SkuMappingSchema } from '@/types/sku-mapping.types';
import { useCreateSkuMapping, useUpdateSkuMapping } from '@/hooks/useSkuMappings';
import { toast } from 'sonner';

interface MapeamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: any; // Dados do pedido para pré-preencher
  skuPedido?: string; // SKU específico a ser mapeado
  onSuccess?: () => void; // Callback quando mapeamento for salvo
}

export function MapeamentoModal({ 
  isOpen, 
  onClose, 
  pedido, 
  skuPedido,
  onSuccess 
}: MapeamentoModalProps) {
  const [existingMapping, setExistingMapping] = useState<SkuMapping | null>(null);
  const createMapping = useCreateSkuMapping();
  const updateMapping = useUpdateSkuMapping();

  // Determinar SKU do pedido
  const skuToMap = skuPedido || pedido?.order_items?.[0]?.sku || pedido?.order_items?.[0]?.item?.sku || '';
  const isEditing = !!existingMapping;

  const form = useForm<SkuMapping>({
    resolver: zodResolver(SkuMappingSchema),
    defaultValues: {
      sku_pedido: skuToMap,
      sku_correspondente: '',
      sku_simples: '',
      quantidade: 1,
      ativo: true,
      observacoes: '',
    },
  });

  // Buscar mapeamento existente quando modal abrir
  useEffect(() => {
    if (isOpen && skuToMap) {
      // Aqui você pode adicionar lógica para buscar mapeamento existente
      // Por enquanto, resetamos o form
      form.reset({
        sku_pedido: skuToMap,
        sku_correspondente: '',
        sku_simples: '',
        quantidade: 1,
        ativo: true,
        observacoes: `Mapeamento criado a partir do pedido ${pedido?.numero || pedido?.id}`,
      });
    }
  }, [isOpen, skuToMap, pedido, form]);

  const onSubmit = async (data: SkuMapping) => {
    try {
      if (isEditing) {
        await updateMapping.mutateAsync({ id: existingMapping.id!, ...data });
        toast.success('Mapeamento atualizado com sucesso!');
      } else {
        await createMapping.mutateAsync(data);
        toast.success('Mapeamento criado com sucesso!');
      }
      
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Erro ao salvar mapeamento');
      console.error('Erro ao salvar mapeamento:', error);
    }
  };

  const isLoading = createMapping.isPending || updateMapping.isPending;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isEditing ? 'Editar Mapeamento' : 'Criar Mapeamento'}
          </DialogTitle>
        </DialogHeader>

        {/* Informações do Pedido */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="font-medium">Dados do Pedido</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Número:</span>
              <span className="ml-2 font-mono">{pedido?.numero || pedido?.id}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cliente:</span>
              <span className="ml-2">{pedido?.nome_cliente || pedido?.buyer?.nickname || '-'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Produto:</span>
              <span className="ml-2">{pedido?.order_items?.[0]?.item?.title || 'Produto não identificado'}</span>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku_pedido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      SKU do Pedido *
                      <Badge variant="secondary" className="text-xs">Automático</Badge>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: SKU001-KIT"
                        {...field}
                        disabled={true} // SKU do pedido é sempre readonly
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku_correspondente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU de Estoque *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: EST-SKU001"
                        {...field}
                        disabled={isLoading}
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku_simples"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU Unitário</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: UNIT-SKU001 (opcional)"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade por Kit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={999}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre este mapeamento..."
                      className="min-h-20"
                      maxLength={500}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Mapeamento Ativo
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Define se este mapeamento deve ser usado nas baixas de estoque
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Separator />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Mapeamento' : 'Criar Mapeamento'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}