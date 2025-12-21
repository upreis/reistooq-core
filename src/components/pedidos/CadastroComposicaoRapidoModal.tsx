/**
 * 🚀 Modal de Cadastro Rápido de Composição
 * Permite criar composição de produto diretamente da página de pedidos
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Package, AlertCircle, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useProducts, Product } from "@/hooks/useProducts";

interface CadastroComposicaoRapidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  skuProduto: string;
  localEstoqueId?: string;
  localEstoqueNome?: string;
  onSuccess?: () => void;
}

interface ComponenteForm {
  sku_componente: string;
  nome_componente: string;
  quantidade: number;
}

export function CadastroComposicaoRapidoModal({
  isOpen,
  onClose,
  skuProduto,
  localEstoqueId,
  localEstoqueNome,
  onSuccess
}: CadastroComposicaoRapidoModalProps) {
  const [componentes, setComponentes] = useState<ComponenteForm[]>([
    { sku_componente: "", nome_componente: "", quantidade: 1 }
  ]);
  const [saving, setSaving] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [produtoInfo, setProdutoInfo] = useState<{ nome: string; id: string } | null>(null);
  const { toast } = useToast();
  const { getProducts } = useProducts();

  // Carregar informações do produto
  useEffect(() => {
    const loadProdutoInfo = async () => {
      if (!skuProduto) return;

      const { data } = await supabase
        .from('produtos')
        .select('id, nome, sku_interno')
        .ilike('sku_interno', skuProduto)
        .eq('ativo', true)
        .maybeSingle();

      if (data) {
        setProdutoInfo({ nome: data.nome, id: data.id });
      }
    };

    if (isOpen) {
      loadProdutoInfo();
    }
  }, [isOpen, skuProduto]);

  // Carregar produtos disponíveis para autocomplete
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await getProducts();
        setAvailableProducts(products);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      }
    };

    if (isOpen && availableProducts.length === 0) {
      loadProducts();
    }
  }, [isOpen]);

  const adicionarComponente = () => {
    if (componentes.length >= 10) {
      toast({
        title: "Limite atingido",
        description: "Máximo de 10 componentes por produto",
        variant: "destructive"
      });
      return;
    }

    setComponentes([
      ...componentes,
      { sku_componente: "", nome_componente: "", quantidade: 1 }
    ]);
  };

  const removerComponente = (index: number) => {
    if (componentes.length <= 1) return;
    setComponentes(componentes.filter((_, i) => i !== index));
  };

  const atualizarComponente = (index: number, field: keyof ComponenteForm, value: any) => {
    setComponentes((prev) => {
      const novos = [...prev];
      novos[index] = { ...novos[index], [field]: value };
      return novos;
    });
  };

  const salvarComposicao = async () => {
    if (!skuProduto || !localEstoqueId) {
      toast({
        title: "Dados incompletos",
        description: "SKU do produto e local de estoque são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Validar componentes
    const componentesValidos = componentes.filter(comp =>
      comp.sku_componente.trim() &&
      comp.nome_componente.trim() &&
      comp.quantidade > 0
    );

    if (componentesValidos.length === 0) {
      toast({
        title: "Nenhum componente válido",
        description: "Adicione pelo menos um componente com SKU, nome e quantidade",
        variant: "destructive"
      });
      return;
    }

    // Verificar duplicados
    const skus = componentesValidos.map(c => c.sku_componente.trim().toUpperCase());
    const duplicados = skus.filter((sku, i) => skus.indexOf(sku) !== i);

    if (duplicados.length > 0) {
      toast({
        title: "Componentes duplicados",
        description: `SKUs duplicados: ${[...new Set(duplicados)].join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Buscar organization_id de um produto existente
      const { data: produtoData } = await supabase
        .from('produtos')
        .select('organization_id')
        .limit(1)
        .single();

      if (!produtoData?.organization_id) {
        throw new Error('Organização não encontrada');
      }

      const organizationId = produtoData.organization_id;

      // Deletar composições existentes deste produto NESTE LOCAL
      const { error: deleteError } = await supabase
        .from('produto_componentes')
        .delete()
        .eq('sku_produto', skuProduto)
        .eq('local_id', localEstoqueId);

      if (deleteError) throw deleteError;

      // Inserir novos componentes
      const componentesParaInserir = componentesValidos.map(comp => ({
        sku_produto: skuProduto,
        sku_componente: comp.sku_componente.trim(),
        nome_componente: comp.nome_componente.trim(),
        quantidade: comp.quantidade,
        organization_id: organizationId,
        local_id: localEstoqueId
      }));

      const { error: insertError } = await supabase
        .from('produto_componentes')
        .insert(componentesParaInserir);

      if (insertError) throw insertError;

      toast({
        title: "Composição cadastrada!",
        description: `${componentesValidos.length} componente(s) cadastrado(s) para ${skuProduto} no local ${localEstoqueNome}`,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar composição:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a composição. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setComponentes([{ sku_componente: "", nome_componente: "", quantidade: 1 }]);
    setProdutoInfo(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Cadastrar Composição
          </DialogTitle>
          <DialogDescription>
            Defina os componentes que formam este produto no local de estoque selecionado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info do Produto */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Produto</p>
                  <p className="font-semibold text-lg">{skuProduto}</p>
                  {produtoInfo && (
                    <p className="text-sm text-muted-foreground">{produtoInfo.nome}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                    <MapPin className="h-3 w-3" />
                    Local de Estoque
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {localEstoqueNome || 'Não definido'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aviso */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Composição por Local
              </p>
              <p className="text-muted-foreground">
                Esta composição será válida apenas para o local <strong>{localEstoqueNome}</strong>. 
                Cada local pode ter sua própria composição.
              </p>
            </div>
          </div>

          {/* Lista de Componentes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Componentes</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarComponente}
                disabled={componentes.length >= 10}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            {componentes.map((comp, index) => (
              <Card key={index} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* SKU */}
                      <div className="space-y-1">
                        <Label className="text-xs">SKU Componente</Label>
                        <Input
                          list={`sku-list-${index}`}
                          value={comp.sku_componente}
                          onChange={(e) => {
                            atualizarComponente(index, 'sku_componente', e.target.value);
                            const produto = availableProducts.find(p =>
                              p.sku_interno.toLowerCase() === e.target.value.toLowerCase()
                            );
                            if (produto) {
                              atualizarComponente(index, 'nome_componente', produto.nome);
                            }
                          }}
                          placeholder="SKU..."
                        />
                        <datalist id={`sku-list-${index}`}>
                          {availableProducts.map((p) => (
                            <option key={p.id} value={p.sku_interno}>
                              {p.nome}
                            </option>
                          ))}
                        </datalist>
                      </div>

                      {/* Nome */}
                      <div className="space-y-1">
                        <Label className="text-xs">Nome</Label>
                        <Input
                          value={comp.nome_componente}
                          onChange={(e) => atualizarComponente(index, 'nome_componente', e.target.value)}
                          placeholder="Nome do componente..."
                        />
                      </div>

                      {/* Quantidade */}
                      <div className="space-y-1">
                        <Label className="text-xs">Quantidade</Label>
                        <Input
                          type="number"
                          min={1}
                          value={comp.quantidade}
                          onChange={(e) => atualizarComponente(index, 'quantidade', parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>

                    {/* Remover */}
                    {componentes.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removerComponente(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={salvarComposicao} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Composição"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
