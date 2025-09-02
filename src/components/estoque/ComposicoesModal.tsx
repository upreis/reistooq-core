import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, Save, X, Package, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShopProduct } from "@/features/shop/types/shop.types";
import { ProdutoComponente } from "@/hooks/useComposicoesEstoque";
import { useProducts, Product } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

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
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [skuOpenIndex, setSkuOpenIndex] = useState<number | null>(null);
  const [nomeOpenIndex, setNomeOpenIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const { getProducts } = useProducts();
  const [skuSearch, setSkuSearch] = useState<string[]>([]);
  const [nomeSearch, setNomeSearch] = useState<string[]>([]);

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
      setSkuSearch(composicoes.map(comp => comp.sku_componente || ""));
      setNomeSearch(composicoes.map(comp => comp.nome_componente || ""));
    } else if (produto) {
      setFormComposicoes([]);
      setSkuSearch([]);
      setNomeSearch([]);
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
        unidade_medida: "UN"
      }
    ]);
    setSkuSearch((prev) => [...prev, ""]);
    setNomeSearch((prev) => [...prev, ""]);
  };

  const removerComposicao = (index: number) => {
    setFormComposicoes(formComposicoes.filter((_, i) => i !== index));
    setSkuSearch((prev) => prev.filter((_, i) => i !== index));
    setNomeSearch((prev) => prev.filter((_, i) => i !== index));
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
          <DialogDescription className="sr-only">
            Editar composições do produto. Use os campos para buscar e selecionar componentes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
                            {composicao.quantidade} <span className="text-sm text-muted-foreground">{composicao.unidade_medida}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Campos de edição */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`sku-${index}`} className="text-sm font-medium">SKU do Componente</Label>
                        <Popover open={skuOpenIndex === index} onOpenChange={(open) => { setSkuOpenIndex(open ? index : null); if (open) { setSkuSearch((prev) => { const next = [...prev]; next[index] = formComposicoes[index]?.sku_componente || ""; return next; }); } }}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={skuOpenIndex === index}
                              className="w-full justify-between text-left font-normal"
                              onClick={() => setSkuOpenIndex(index)}
                            >
                              <span className="truncate">
                                {composicao.sku_componente || "Selecione ou digite um SKU..."}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent onWheelCapture={(e) => e.stopPropagation()} className="w-[--radix-popover-trigger-width] p-0 z-[9999] bg-background border border-border shadow-lg overscroll-contain">
                            <Command className="bg-background text-foreground">
                              <CommandInput 
                                placeholder="Buscar por SKU..." 
                                value={skuSearch[index] ?? ""}
                                onValueChange={(value) => {
                                  setSkuSearch((prev) => {
                                    const next = [...prev];
                                    next[index] = value;
                                    return next;
                                  });
                                }}
                              />
                               <CommandList className="max-h-60 overflow-y-auto overscroll-contain touch-pan-y bg-background">
                                <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                                <CommandGroup>
                                  {availableProducts
                                    .filter(product => 
                                      product.sku_interno.toLowerCase().includes((skuSearch[index] ?? "").toLowerCase())
                                    )
                                    .map((product) => (
                                      <CommandItem
                                        key={product.id}
                                        value={product.sku_interno}
                                        onSelect={() => {
                                          atualizarComposicao(index, 'sku_componente', product.sku_interno);
                                          atualizarComposicao(index, 'nome_componente', product.nome);
                                          setSkuSearch((prev) => {
                                            const next = [...prev];
                                            next[index] = product.sku_interno;
                                            return next;
                                          });
                                          setSkuOpenIndex(null);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            composicao.sku_componente === product.sku_interno ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <div>
                                          <div className="font-medium">{product.sku_interno}</div>
                                          <div className="text-sm text-muted-foreground">{product.nome}</div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`nome-${index}`} className="text-sm font-medium">Nome do Componente</Label>
                        <Popover open={nomeOpenIndex === index} onOpenChange={(open) => { setNomeOpenIndex(open ? index : null); if (open) { setNomeSearch((prev) => { const next = [...prev]; next[index] = formComposicoes[index]?.nome_componente || ""; return next; }); } }}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={nomeOpenIndex === index}
                              className="w-full justify-between text-left font-normal"
                              onClick={() => setNomeOpenIndex(index)}
                            >
                              <span className="truncate">
                                {composicao.nome_componente || "Selecione ou digite um nome..."}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent onWheelCapture={(e) => e.stopPropagation()} className="w-[--radix-popover-trigger-width] p-0 z-[9999] bg-background border border-border shadow-lg overscroll-contain">
                            <Command className="bg-background text-foreground">
                              <CommandInput 
                                placeholder="Buscar por nome..." 
                                value={nomeSearch[index] ?? ""}
                                onValueChange={(value) => {
                                  setNomeSearch((prev) => {
                                    const next = [...prev];
                                    next[index] = value;
                                    return next;
                                  });
                                }}
                              />
                              <CommandList className="max-h-60 overflow-y-auto overscroll-contain touch-pan-y bg-background">
                                <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                                <CommandGroup>
                                  {availableProducts
                                    .filter(product => 
                                      product.nome.toLowerCase().includes((nomeSearch[index] ?? "").toLowerCase())
                                    )
                                    .map((product) => (
                                      <CommandItem
                                        key={product.id}
                                        value={product.nome}
                                        onSelect={() => {
                                          atualizarComposicao(index, 'nome_componente', product.nome);
                                          atualizarComposicao(index, 'sku_componente', product.sku_interno);
                                          setNomeSearch((prev) => {
                                            const next = [...prev];
                                            next[index] = product.nome;
                                            return next;
                                          });
                                          setNomeOpenIndex(null);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            composicao.nome_componente === product.nome ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <div>
                                          <div className="font-medium">{product.nome}</div>
                                          <div className="text-sm text-muted-foreground">{product.sku_interno}</div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
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
                        <Input
                          id={`unidade-${index}`}
                          value={composicao.unidade_medida}
                          onChange={(e) => atualizarComposicao(index, 'unidade_medida', e.target.value)}
                          placeholder="Ex: UN, KG, M"
                          className="font-medium"
                        />
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