import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { useProducts, Product } from "@/hooks/useProducts";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ComposicoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: ShopProduct | null;
  composicoes: ProdutoComponente[];
  onSave: () => void;
  localId?: string;
}

interface ComposicaoForm {
  id?: string;
  sku_componente: string;
  nome_componente: string;
  quantidade: number;
  unidade_medida_id: string;
}

export function ComposicoesModal({ isOpen, onClose, produto, composicoes, onSave, localId }: ComposicoesModalProps) {
  const [formComposicoes, setFormComposicoes] = useState<ComposicaoForm[]>([]);
  const [saving, setSaving] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const { toast } = useToast();
  const { getProducts } = useProducts();
  const { unidades, getUnidadeById } = useUnidadesMedida();
  
  // Estados para editar o produto principal da composição
  const [produtoSku, setProdutoSku] = useState("");
  const [produtoNome, setProdutoNome] = useState("");

  useEffect(() => {
    if (produto) {
      setProdutoSku(produto.sku_interno || "");
      setProdutoNome(produto.nome || "");
      
      if (composicoes) {
        setFormComposicoes(
          composicoes.map(comp => ({
            id: comp.id,
            sku_componente: comp.sku_componente,
            nome_componente: comp.nome_componente,
            quantidade: comp.quantidade,
            unidade_medida_id: comp.unidade_medida_id || ""
          }))
        );
      } else {
        setFormComposicoes([]);
      }
    }
  }, [produto, composicoes]);

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

  const adicionarComposicao = () => {
    // Limitar a 10 componentes máximo
    if (formComposicoes.length >= 10) {
      toast({
        title: "Limite atingido",
        description: "Máximo de 10 componentes por produto",
        variant: "destructive"
      });
      return;
    }

    setFormComposicoes([
      ...formComposicoes,
      {
        sku_componente: "",
        nome_componente: "",
        quantidade: 1,
        unidade_medida_id: ""
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
    if (!produto) return;

    // Validar se SKU e nome do produto foram preenchidos
    if (!produtoSku.trim() || !produtoNome.trim()) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha o SKU e nome do produto",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Primeiro, atualizar os dados do produto na tabela produtos_composicoes
      const { error: updateProdutoError } = await supabase
        .from('produtos_composicoes')
        .update({
          sku_interno: produtoSku.trim(),
          nome: produtoNome.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', produto.id);

      if (updateProdutoError) throw updateProdutoError;

      // Validar campos obrigatórios dos componentes
      const composicoesValidas = formComposicoes.filter(comp => 
        comp.sku_componente.trim() && 
        comp.nome_componente.trim() && 
        comp.quantidade > 0
      );

      // 🛡️ VALIDAÇÃO: Não permitir componentes duplicados
      const skusComponentes = composicoesValidas.map(c => c.sku_componente.trim().toUpperCase());
      const skusDuplicados = skusComponentes.filter((sku, index) => skusComponentes.indexOf(sku) !== index);
      
      if (skusDuplicados.length > 0) {
        toast({
          title: "Componentes duplicados",
          description: `Os seguintes SKUs estão duplicados: ${[...new Set(skusDuplicados)].join(', ')}`,
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      // Verificar se localId está presente
      if (!localId) {
        throw new Error('Local de estoque não definido');
      }

      // Deletar composições existentes deste produto NESTE LOCAL
      const { error: deleteError } = await supabase
        .from('produto_componentes')
        .delete()
        .eq('sku_produto', produtoSku.trim())
        .eq('local_id', localId);

      if (deleteError) {
        console.error('Erro ao deletar composições:', deleteError);
        throw deleteError;
      }

      // Inserir novas composições se houver alguma válida
      if (composicoesValidas.length > 0) {
        // Buscar organization_id de um produto existente
        const { data: productData } = await supabase
          .from('produtos')
          .select('organization_id')
          .limit(1)
          .single();

        if (!productData?.organization_id) {
          throw new Error('Não foi possível obter o ID da organização');
        }

        // Verificar se localId está presente
        if (!localId) {
          throw new Error('Local de estoque não definido');
        }

        const composicoesParaInserir = composicoesValidas.map(comp => ({
          sku_produto: produtoSku.trim(),
          sku_componente: comp.sku_componente.trim(),
          nome_componente: comp.nome_componente.trim(),
          quantidade: comp.quantidade,
          unidade_medida_id: comp.unidade_medida_id || null,
          organization_id: productData.organization_id,
          local_id: localId
        }));

        console.log('📦 Inserindo composições:', composicoesParaInserir);

        const { error: insertError } = await supabase
          .from('produto_componentes')
          .insert(composicoesParaInserir);

        if (insertError) {
          console.error('Erro ao inserir composições:', insertError);
          throw insertError;
        }
      }

      toast({
        title: "Composições salvas com sucesso!",
        description: `${composicoesValidas.length} componente(s) configurado(s) para ${produtoNome}`,
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
            Editar Composições - {produtoNome || produto?.nome || "Nova Composição"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Editar dados do produto e suas composições. Use os campos para buscar e selecionar componentes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seção de Edição do Produto Principal */}
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
                  <Label htmlFor="produto-sku" className="text-sm font-medium">SKU do Produto</Label>
                  <Input
                    id="produto-sku"
                    value={produtoSku}
                    onChange={(e) => setProdutoSku(e.target.value)}
                    placeholder="Digite o SKU do produto..."
                    className="w-full"
                  />
                </div>

                {/* Nome do Produto */}
                <div className="space-y-2">
                  <Label htmlFor="produto-nome" className="text-sm font-medium">Nome do Produto</Label>
                  <Input
                    id="produto-nome"
                    value={produtoNome}
                    onChange={(e) => setProdutoNome(e.target.value)}
                    placeholder="Digite o nome do produto..."
                    className="w-full"
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
            {formComposicoes.map((composicao, index) => (
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
                          {composicao.nome_componente || "Nome não definido"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removerComposicao(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Informações do SKU em destaque */}
                  {composicao.sku_componente && (
                    <div className="mb-4 p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SKU Componente</Label>
                          <p className="text-lg font-mono font-semibold">{composicao.sku_componente}</p>
                        </div>
                        <div className="text-right">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quantidade</Label>
          <p className="text-lg font-semibold">
            {composicao.quantidade} <span className="text-sm text-muted-foreground">
              {composicao.unidade_medida_id ? getUnidadeById(composicao.unidade_medida_id)?.abreviacao || 'UN' : 'UN'}
            </span>
          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Campos de edição */}
                  <div className="space-y-4">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                       {/* SKU do Componente - Input Direto com Datalist */}
                       <div className="space-y-2">
                         <Label htmlFor={`sku-${index}`} className="text-sm font-medium">SKU do Componente</Label>
                         <div className="relative">
                           <Input
                             id={`sku-${index}`}
                             list={`sku-list-${index}`}
                             value={composicao.sku_componente}
                             onChange={(e) => {
                               atualizarComposicao(index, 'sku_componente', e.target.value);
                               // Auto-completar nome se encontrar produto correspondente
                               const produto = availableProducts.find(p => 
                                 p.sku_interno.toLowerCase() === e.target.value.toLowerCase()
                               );
                               if (produto) {
                                 atualizarComposicao(index, 'nome_componente', produto.nome);
                               }
                             }}
                             placeholder="Digite ou selecione um SKU..."
                             className="w-full"
                           />
                           <datalist id={`sku-list-${index}`}>
                             {availableProducts.map((product) => (
                               <option key={product.id} value={product.sku_interno}>
                                 {product.nome}
                               </option>
                             ))}
                           </datalist>
                         </div>
                         {composicao.sku_componente && !availableProducts.some(p => p.sku_interno === composicao.sku_componente) && (
                           <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                             <Plus className="h-3 w-3" />
                             Novo componente será criado
                           </p>
                         )}
                       </div>

                       {/* Nome do Componente - Input Direto com Datalist */}
                       <div className="space-y-2">
                         <Label htmlFor={`nome-${index}`} className="text-sm font-medium">Nome do Componente</Label>
                         <div className="relative">
                           <Input
                             id={`nome-${index}`}
                             list={`nome-list-${index}`}
                             value={composicao.nome_componente}
                             onChange={(e) => {
                               atualizarComposicao(index, 'nome_componente', e.target.value);
                               // Auto-completar SKU se encontrar produto correspondente
                               const produto = availableProducts.find(p => 
                                 p.nome.toLowerCase() === e.target.value.toLowerCase()
                               );
                               if (produto) {
                                 atualizarComposicao(index, 'sku_componente', produto.sku_interno);
                               }
                             }}
                             placeholder="Digite ou selecione um nome..."
                             className="w-full"
                           />
                           <datalist id={`nome-list-${index}`}>
                             {availableProducts.map((product) => (
                               <option key={product.id} value={product.nome}>
                                 {product.sku_interno}
                               </option>
                             ))}
                           </datalist>
                         </div>
                       </div>
                     </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`quantidade-${index}`} className="text-sm font-medium">Quantidade</Label>
                        <Input
                          id={`quantidade-${index}`}
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={composicao.quantidade}
                          onChange={(e) => atualizarComposicao(index, 'quantidade', parseFloat(e.target.value) || 0)}
                          className="text-lg font-semibold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`unidade-${index}`} className="text-sm font-medium">Unidade de Medida</Label>
                        <Select 
                          value={composicao.unidade_medida_id} 
                          onValueChange={(value) => atualizarComposicao(index, 'unidade_medida_id', value)}
                        >
                          <SelectTrigger className="font-medium">
                            <SelectValue placeholder="Selecione a unidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {unidades
                              .filter(u => u.ativo)
                              .map((unidade) => (
                                <SelectItem key={unidade.id} value={unidade.id}>
                                  {unidade.nome} ({unidade.abreviacao})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
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
          </div>

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