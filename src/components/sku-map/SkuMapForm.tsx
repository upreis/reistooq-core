import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SkuMapping, SkuMappingSchema } from "@/types/sku-mapping.types";
import { useCreateSkuMapping, useUpdateSkuMapping } from "@/hooks/useSkuMappings";

interface SkuMapFormProps {
  initialData?: SkuMapping | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SkuMapForm({ initialData, onSuccess, onCancel }: SkuMapFormProps) {
  const createMapping = useCreateSkuMapping();
  const updateMapping = useUpdateSkuMapping();
  const isEditing = !!initialData;

  const form = useForm<SkuMapping>({
    resolver: zodResolver(SkuMappingSchema),
    defaultValues: {
      sku_pedido: initialData?.sku_pedido || "",
      sku_correspondente: initialData?.sku_correspondente || "",
      sku_simples: initialData?.sku_simples || "",
      quantidade: initialData?.quantidade || 1,
      ativo: initialData?.ativo ?? true,
      observacoes: initialData?.observacoes || "",
    },
  });

  const onSubmit = async (data: SkuMapping) => {
    try {
      if (isEditing) {
        await updateMapping.mutateAsync({ id: initialData.id!, ...data });
      } else {
        await createMapping.mutateAsync(data);
      }
      onSuccess();
    } catch (error) {
      // Error handled by hooks
    }
  };

  const isLoading = createMapping.isPending || updateMapping.isPending;

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Editar Mapeamento" : "Novo Mapeamento"}
        </DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sku_pedido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU do Pedido *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: SKU001-KIT"
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
              name="sku_correspondente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU Correto</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: SKU001-CORRIGIDO"
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
              name="sku_simples"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU Mapeamento</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: SKU001-UNIT"
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
                  <FormLabel>Quantidade</FormLabel>
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
                    placeholder="Observações adicionais..."
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
                  <FormLabel className="text-base">Status Ativo</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Define se o mapeamento está ativo ou inativo
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
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}