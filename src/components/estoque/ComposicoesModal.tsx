import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, X, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShopProduct } from "@/features/shop/types/shop.types";
import { ProdutoComponente } from "@/hooks/useComposicoesEstoque";

interface ComposicoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: ShopProduct | null;
  composicoes: ProdutoComponente[];
  onSave: () => void;
}

interface ComposicaoForm {
  id?: string;
  sku_componente: string;
  nome_componente: string;
  quantidade: number;
  unidade_medida: string;
}

export function ComposicoesModal({ isOpen, onClose, produto, composicoes, onSave }: ComposicoesModalProps) {
  const [formComposicoes, setFormComposicoes] = useState<ComposicaoForm[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (produto && composicoes) {
      setFormComposicoes(
        composicoes.map(comp => ({
          id: comp.id,
          sku_componente: comp.sku_componente,
          nome_componente: comp.nome_componente,
          quantidade: comp.quantidade,
          unidade_medida: comp.unidade_medida
        }))
      );
    } else if (produto) {
      setFormComposicoes([]);
    }
  }, [produto, composicoes]);

  const adicionarComposicao = () => {
    setFormComposicoes([
      ...formComposicoes,
      {
        sku_componente: "",
        nome_componente: "",
        quantidade: 1,
        unidade_medida: "UN"
      }
    ]);
  };

  const removerComposicao = (index: number) => {
    setFormComposicoes(formComposicoes.filter((_, i) => i !== index));
  };

  const atualizarComposicao = (index: number, field: keyof ComposicaoForm, value: any) => {
    const novasComposicoes = [...formComposicoes];
    novasComposicoes[index] = {
      ...novasComposicoes[index],
      [field]: value
    };
    setFormComposicoes(novasComposicoes);
  };

  const salvarComposicoes = async () => {
    if (!produto) return;

    setSaving(true);
    try {
      // Validar campos obrigatórios
      const composicoesValidas = formComposicoes.filter(comp => 
        comp.sku_componente.trim() && 
        comp.nome_componente.trim() && 
        comp.quantidade > 0
      );

      // Deletar composições existentes
      if (composicoes.length > 0) {
        const { error: deleteError } = await supabase
          .from('produto_componentes')
          .delete()
          .eq('sku_produto', produto.sku_interno);

        if (deleteError) throw deleteError;
      }

      // Inserir novas composições se houver alguma válida
      if (composicoesValidas.length > 0) {
        // Buscar organization_id de um produto existente
        const { data: productData } = await supabase
          .from('produtos')
          .select('organization_id')
          .eq('sku_interno', produto.sku_interno)
          .single();

        if (!productData?.organization_id) {
          throw new Error('Não foi possível obter o ID da organização');
        }

        const composicoesParaInserir = composicoesValidas.map(comp => ({
          sku_produto: produto.sku_interno,
          sku_componente: comp.sku_componente.trim(),
          nome_componente: comp.nome_componente.trim(),
          quantidade: comp.quantidade,
          unidade_medida: comp.unidade_medida.trim() || 'UN',
          organization_id: productData.organization_id
        }));

        const { error: insertError } = await supabase
          .from('produto_componentes')
          .insert(composicoesParaInserir);

        if (insertError) throw insertError;
      }

      toast({
        title: "Composições salvas com sucesso!",
        description: `${composicoesValidas.length} componente(s) configurado(s) para ${produto.nome}`,
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar composições:', error);
      toast({
        title: "Erro ao salvar composições",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!produto) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Editar Composições - {produto.nome}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            SKU Produto: <Badge variant="outline">{produto.sku_interno}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de Composições */}
          <div className="space-y-3">
            {formComposicoes.map((composicao, index) => (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Componente #{index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removerComposicao(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`sku-${index}`}>SKU do Componente</Label>
                      <Input
                        id={`sku-${index}`}
                        value={composicao.sku_componente}
                        onChange={(e) => atualizarComposicao(index, 'sku_componente', e.target.value)}
                        placeholder="Ex: COMP-001"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`nome-${index}`}>Nome do Componente</Label>
                      <Input
                        id={`nome-${index}`}
                        value={composicao.nome_componente}
                        onChange={(e) => atualizarComposicao(index, 'nome_componente', e.target.value)}
                        placeholder="Ex: Parafuso M6"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`quantidade-${index}`}>Quantidade</Label>
                      <Input
                        id={`quantidade-${index}`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={composicao.quantidade}
                        onChange={(e) => atualizarComposicao(index, 'quantidade', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`unidade-${index}`}>Unidade de Medida</Label>
                      <Input
                        id={`unidade-${index}`}
                        value={composicao.unidade_medida}
                        onChange={(e) => atualizarComposicao(index, 'unidade_medida', e.target.value)}
                        placeholder="Ex: UN, KG, M"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Botão Adicionar Nova Composição */}
          <Button
            variant="outline"
            onClick={adicionarComposicao}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Componente
          </Button>

          {/* Ações do Modal */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={salvarComposicoes} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Composições"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}