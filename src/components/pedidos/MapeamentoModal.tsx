/**
 * 🔗 MODAL DE MAPEAMENTO INLINE PARA PÁGINA PEDIDOS
 * Permite criar/editar mapeamentos sem sair da página de pedidos
 */

import { useState, useEffect } from 'react';
import { debugLog } from '@/utils/logger';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AlertTriangle, Package, CheckCircle, ChevronsUpDown, Check } from 'lucide-react';
import { SkuMapping, SkuMappingSchema } from '@/types/sku-mapping.types';
import { useCreateSkuMapping, useUpdateSkuMapping } from '@/hooks/useSkuMappings';
import { useProdutosComposicoes } from '@/hooks/useProdutosComposicoes';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const [openSkuPopover, setOpenSkuPopover] = useState(false);
  const createMapping = useCreateSkuMapping();
  const updateMapping = useUpdateSkuMapping();
  const { produtos, isLoading: isLoadingProdutos } = useProdutosComposicoes();

  // Determinar SKU do pedido - verificar múltiplas estruturas possíveis
  const skuToMap = skuPedido || 
    pedido?.order_items?.[0]?.sku || 
    pedido?.order_items?.[0]?.item?.sku || 
    pedido?.order_items?.[0]?.item?.seller_sku ||
    pedido?.skus_produtos?.split(', ')?.[0] ||
    pedido?.sku_produto ||
    '';
    
  debugLog('SKU extraction', {
    pedido: pedido,
    order_items: pedido?.order_items,
    skuToMap,
    skuPedido,
    estruturas: {
      'order_items[0].sku': pedido?.order_items?.[0]?.sku,
      'order_items[0].item.sku': pedido?.order_items?.[0]?.item?.sku,
      'order_items[0].item.seller_sku': pedido?.order_items?.[0]?.item?.seller_sku,
      'skus_produtos': pedido?.skus_produtos,
      'sku_produto': pedido?.sku_produto
    }
  });
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
    if (isOpen && pedido) {
      console.log('🔄 Atualizando form com dados do pedido:', { pedido, skuToMap });
      
      // Reset do form sempre que o modal abrir
      form.reset({
        sku_pedido: skuToMap,
        sku_correspondente: '',
        sku_simples: '',
        quantidade: 1,
        ativo: true,
        observacoes: `Mapeamento criado a partir do pedido ${pedido?.numero || pedido?.order_number || pedido?.id}`,
      });
      
      // Force update do campo SKU do pedido se não foi preenchido
      if (skuToMap) {
        form.setValue('sku_pedido', skuToMap, { shouldValidate: true });
      }
    }
  }, [isOpen, pedido, skuToMap, form]);

  const onSubmit = async (data: SkuMapping) => {
    try {
      console.log('📝 Enviando dados do mapeamento:', data);
      
      if (isEditing) {
        await updateMapping.mutateAsync({ id: existingMapping.id!, ...data });
        toast.success('Mapeamento atualizado com sucesso!');
      } else {
        // Validação antes de enviar
        if (!data.sku_pedido?.trim()) {
          toast.error('SKU do pedido é obrigatório');
          return;
        }
        
        await createMapping.mutateAsync(data);
        toast.success('Mapeamento criado com sucesso!');
      }
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('❌ Erro detalhado ao salvar mapeamento:', error);
      
      // Melhor tratamento de erros
      let errorMessage = 'Erro ao salvar mapeamento';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(errorMessage);
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
              <span className="ml-2 font-mono">{pedido?.numero || pedido?.order_number || pedido?.id}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cliente:</span>
              <span className="ml-2">{pedido?.nome_cliente || pedido?.buyer?.nickname || '-'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">SKU Detectado:</span>
              <span className={`ml-2 font-mono ${skuToMap ? 'text-green-600' : 'text-red-500'}`}>
                {skuToMap || 'NENHUM SKU ENCONTRADO'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Produto:</span>
              <span className="ml-2">{pedido?.order_items?.[0]?.item?.title || pedido?.titulo_anuncio || 'Produto não identificado'}</span>
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
                      {!skuToMap && <Badge variant="destructive" className="text-xs">ERRO</Badge>}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: SKU001-KIT"
                        {...field}
                        disabled={false} // Permitir edição caso SKU não seja detectado
                        className={skuToMap ? "bg-muted" : "border-red-500"}
                        value={field.value || skuToMap} // Force value update
                      />
                    </FormControl>
                    {!skuToMap && (
                      <p className="text-sm text-destructive">
                        ⚠️ SKU não detectado automaticamente. Digite manualmente.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku_correspondente"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>SKU Estoque Filho *</FormLabel>
                    <Popover open={openSkuPopover} onOpenChange={setOpenSkuPopover}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openSkuPopover}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoading}
                          >
                            {field.value || "Selecione ou digite o SKU..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Digite para buscar SKU..." 
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                            }}
                          />
                          <CommandList className="max-h-[300px] overflow-y-auto">
                            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                            <CommandGroup>
                              {produtos
                                .filter(p => 
                                  !field.value || 
                                  p.sku_interno.toLowerCase().includes(field.value.toLowerCase()) ||
                                  p.nome.toLowerCase().includes(field.value.toLowerCase())
                                )
                                .map((produto) => (
                                  <CommandItem
                                    key={produto.id}
                                    value={produto.sku_interno}
                                    onSelect={() => {
                                      field.onChange(produto.sku_interno);
                                      setOpenSkuPopover(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === produto.sku_interno
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">{produto.sku_interno}</span>
                                      <span className="text-xs text-muted-foreground">{produto.nome}</span>
                                    </div>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku_simples"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU Composição do Produto</FormLabel>
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
                    <FormLabel>Quantidade Por Kit ou Unidade</FormLabel>
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