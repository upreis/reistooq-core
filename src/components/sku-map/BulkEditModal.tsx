import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, X } from "lucide-react";
import { useBulkSkuActions } from "@/hooks/useSkuMappings";

const BulkEditSchema = z.object({
  ativo: z.boolean().optional(),
  quantidade: z.number().min(1).max(999).optional(),
  observacoes: z.string().max(500).optional(),
});

type BulkEditData = z.infer<typeof BulkEditSchema>;

interface BulkEditModalProps {
  selectedItems: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkEditModal({ selectedItems, onClose, onSuccess }: BulkEditModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fieldsToUpdate, setFieldsToUpdate] = useState<Set<keyof BulkEditData>>(new Set());
  const bulkActions = useBulkSkuActions();

  const form = useForm<BulkEditData>({
    resolver: zodResolver(BulkEditSchema),
    defaultValues: {
      ativo: true,
      quantidade: 1,
      observacoes: "",
    },
  });

  const handleFieldToggle = (field: keyof BulkEditData) => {
    setFieldsToUpdate(prev => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        newSet.delete(field);
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  };

  const onSubmit = async (data: BulkEditData) => {
    // Aqui você implementaria a lógica de bulk edit
    // Por enquanto, vamos usar a ação de ativar/desativar como exemplo
    try {
      if (fieldsToUpdate.has('ativo')) {
        await bulkActions.mutateAsync({
          action: data.ativo ? 'activate' : 'deactivate',
          ids: selectedItems,
        });
      }
      
      onSuccess();
      setIsOpen(false);
      setFieldsToUpdate(new Set());
    } catch (error) {
      // Error handled by hook
    }
  };

  const fieldLabels = {
    ativo: 'Status',
    quantidade: 'Quantidade',
    observacoes: 'Observações',
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Editar em Lote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar em Lote</DialogTitle>
          <div className="text-sm text-muted-foreground">
            Editando {selectedItems.length} item(ns) selecionado(s)
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Field Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campos para Atualizar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(Object.keys(fieldLabels) as Array<keyof BulkEditData>).map((field) => (
                    <div
                      key={field}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        fieldsToUpdate.has(field)
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                      onClick={() => handleFieldToggle(field)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{fieldLabels[field]}</span>
                        {fieldsToUpdate.has(field) && (
                          <Badge variant="default" className="text-xs">
                            Selecionado
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Form Fields */}
            {fieldsToUpdate.size > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Novos Valores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fieldsToUpdate.has('ativo') && (
                    <FormField
                      control={form.control}
                      name="ativo"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Status Ativo</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Define se os mapeamentos estão ativos ou inativos
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={bulkActions.isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  {fieldsToUpdate.has('quantidade') && (
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
                              disabled={bulkActions.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {fieldsToUpdate.has('observacoes') && (
                    <FormField
                      control={form.control}
                      name="observacoes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Observações que serão aplicadas a todos os itens selecionados..."
                              className="min-h-20"
                              maxLength={500}
                              {...field}
                              disabled={bulkActions.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  setFieldsToUpdate(new Set());
                }}
                disabled={bulkActions.isPending}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={fieldsToUpdate.size === 0 || bulkActions.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {bulkActions.isPending ? "Salvando..." : `Atualizar ${selectedItems.length} itens`}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}