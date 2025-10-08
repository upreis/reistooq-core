import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProducts, Product } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VariationProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  parentProducts: Product[]; // Lista de produtos PAI disponíveis
}

export const VariationProductModal = ({
  open,
  onOpenChange,
  onComplete,
  parentProducts,
}: VariationProductModalProps) => {
  const { createProduct } = useProducts();
  const { toast } = useToast();
  
  const [selectedParentSku, setSelectedParentSku] = useState("");
  const [suffix, setSuffix] = useState("");
  const [quantity, setQuantity] = useState("");
  const [barcode, setBarcode] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const selectedParent = parentProducts.find(p => p.sku_interno === selectedParentSku);

  const handleCreate = async () => {
    if (!selectedParentSku || !suffix.trim()) {
      toast({
        title: "Erro",
        description: "Selecione um SKU PAI e informe o sufixo da variação",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const newVariation = await createProduct({
        sku_interno: `${selectedParentSku}${suffix}`,
        nome: `${selectedParent?.nome} ${suffix}`,
        categoria: selectedParent?.categoria || null,
        descricao: selectedParent?.descricao || null,
        codigo_barras: barcode || null,
        quantidade_atual: parseInt(quantity) || 0,
        estoque_minimo: 0,
        estoque_maximo: 0,
        preco_custo: null,
        preco_venda: null,
        localizacao: null,
        unidade_medida_id: selectedParent?.unidade_medida_id || null,
        status: 'ativo',
        ativo: true,
        url_imagem: null,
        sku_pai: selectedParentSku, // ✅ LIGAR AO PAI
      });

      toast({
        title: "✅ Variação criada",
        description: `${newVariation.sku_interno} foi criado com sucesso!`,
      });

      handleClose();
      onComplete();
    } catch (error) {
      toast({
        title: "Erro ao criar variação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setSelectedParentSku("");
    setSuffix("");
    setQuantity("");
    setBarcode("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Variação (SKU Filho)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Selecionar SKU PAI */}
          <div>
            <Label htmlFor="parent_sku">SKU PAI *</Label>
            <Select value={selectedParentSku} onValueChange={setSelectedParentSku}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o SKU PAI" />
              </SelectTrigger>
              <SelectContent>
                {parentProducts.map((product) => (
                  <SelectItem key={product.id} value={product.sku_interno}>
                    {product.sku_interno} - {product.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sufixo da variação */}
          <div>
            <Label htmlFor="suffix">Sufixo da Variação *</Label>
            <Input
              id="suffix"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              placeholder="Ex: -P, -M, -G, -AZUL"
              disabled={!selectedParentSku}
            />
            {selectedParentSku && suffix && (
              <p className="text-xs text-muted-foreground mt-1">
                SKU Final: <span className="font-semibold">{selectedParentSku}{suffix}</span>
              </p>
            )}
          </div>

          {/* Quantidade inicial */}
          <div>
            <Label htmlFor="quantity">Quantidade Inicial</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              disabled={!selectedParentSku}
            />
          </div>

          {/* Código de barras */}
          <div>
            <Label htmlFor="barcode">Código de Barras</Label>
            <Input
              id="barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="EAN/UPC (opcional)"
              disabled={!selectedParentSku}
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !selectedParentSku || !suffix.trim()}
          >
            {isCreating ? "Criando..." : "Criar Variação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
