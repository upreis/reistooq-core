import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useProducts } from "@/hooks/useProducts";

const AddProduct = () => {
  const { createProduct } = useProducts();
  
  // Estados para todos os campos
  const [formData, setFormData] = useState({
    sku_interno: "",
    nome: "",
    descricao: "",
    preco_venda: 0,
    preco_custo: 0,
    quantidade_atual: 0,
    estoque_minimo: 0,
    estoque_maximo: 0,
    localizacao: "",
    ativo: true,
    unidade_medida_id: null as string | null,
    status: "ativo" as const,
    url_imagem: "",
    codigo_barras: "",
    categoria: "",
    imagem_fornecedor: "",
    material: "",
    cor: "",
    package: "",
    unit: "",
    pcs_ctn: 0,
    peso_unitario_g: 0,
    peso_cx_master_kg: 0,
    comprimento_cm: 0,
    largura_cm: 0,
    altura_cm: 0,
    observacoes: ""
  });

  // Campos calculados
  const [calculatedFields, setCalculatedFields] = useState({
    peso_sem_cx_master_kg: 0,
    peso_total_cx_master_kg: 0,
    peso_total_sem_cx_master_kg: 0,
    cbm_cubagem: 0,
    cbm_total: 0,
    quantidade_total: 0,
    valor_total: 0
  });

  // Recalcular campos derivados quando os campos base mudarem
  useEffect(() => {
    const pesoSemCxMaster = Math.max(formData.peso_cx_master_kg - 1, 0);
    const pesoTotalCxMaster = formData.peso_cx_master_kg * formData.quantidade_atual;
    const pesoTotalSemCxMaster = pesoSemCxMaster * formData.quantidade_atual;
    const cbmCubagem = (formData.comprimento_cm * formData.largura_cm * formData.altura_cm) / 1000000;
    const cbmTotal = cbmCubagem * formData.quantidade_atual;
    const quantidadeTotal = formData.pcs_ctn * formData.quantidade_atual;
    const valorTotal = formData.preco_venda * quantidadeTotal;

    setCalculatedFields({
      peso_sem_cx_master_kg: pesoSemCxMaster,
      peso_total_cx_master_kg: pesoTotalCxMaster,
      peso_total_sem_cx_master_kg: pesoTotalSemCxMaster,
      cbm_cubagem: cbmCubagem,
      cbm_total: cbmTotal,
      quantidade_total: quantidadeTotal,
      valor_total: valorTotal
    });
  }, [formData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.sku_interno || !formData.nome) {
        toast.error("SKU e Nome são obrigatórios");
        return;
      }

      await createProduct(formData);
      toast.success("Produto criado com sucesso!");
      
      // Reset form
      setFormData({
        sku_interno: "",
        nome: "",
        descricao: "",
        preco_venda: 0,
        preco_custo: 0,
        quantidade_atual: 0,
        estoque_minimo: 0,
        estoque_maximo: 0,
        localizacao: "",
        ativo: true,
        unidade_medida_id: null,
        status: "ativo" as const,
        url_imagem: "",
        codigo_barras: "",
        categoria: "",
        imagem_fornecedor: "",
        material: "",
        cor: "",
        package: "",
        unit: "",
        pcs_ctn: 0,
        peso_unitario_g: 0,
        peso_cx_master_kg: 0,
        comprimento_cm: 0,
        largura_cm: 0,
        altura_cm: 0,
        observacoes: ""
      });
    } catch (error) {
      toast.error("Erro ao criar produto");
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>🏠</span>
        <span>/</span>
        <span className="text-primary">Adicionar Produto</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Nome do Produto</Label>
                <Input id="productName" placeholder="Digite o nome do produto" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" placeholder="Descreva o produto..." rows={4} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" placeholder="ABC123" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Código de Barras</Label>
                  <Input id="barcode" placeholder="1234567890123" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preços e Estoque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço</Label>
                  <Input id="price" type="number" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comparePrice">Preço Comparativo</Label>
                  <Input id="comparePrice" type="number" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Preço de Custo</Label>
                  <Input id="costPrice" type="number" placeholder="0.00" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input id="quantity" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowStock">Estoque Baixo</Label>
                  <Input id="lowStock" type="number" placeholder="5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imagens do Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Adicionar Imagens</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Arraste e solte imagens aqui ou clique para selecionar
                </p>
                <Button variant="outline">Selecionar Arquivos</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status do Produto</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="visibility">Visibilidade</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a visibilidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Público</SelectItem>
                    <SelectItem value="private">Privado</SelectItem>
                    <SelectItem value="hidden">Oculto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Eletrônicos</SelectItem>
                    <SelectItem value="clothing">Roupas</SelectItem>
                    <SelectItem value="home">Casa e Jardim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input id="tags" placeholder="Digite as tags separadas por vírgula" />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col space-y-2">
            <Button className="w-full">Salvar Produto</Button>
            <Button variant="outline" className="w-full">Salvar como Rascunho</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;