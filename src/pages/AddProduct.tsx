import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload } from "lucide-react";

const AddProduct = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>🏠</span>
          <span>/</span>
          <span className="text-primary">Adicionar Produto</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Gerais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Nome do Produto *</Label>
                  <Input id="productName" placeholder="Nome do Produto" />
                  <p className="text-sm text-muted-foreground">
                    O nome do produto é obrigatório e recomenda-se que seja único.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <div className="border rounded-lg">
                    <div className="flex items-center space-x-2 p-3 border-b bg-muted/50">
                      <Button variant="ghost" size="sm">B</Button>
                      <Button variant="ghost" size="sm">I</Button>
                      <Button variant="ghost" size="sm">U</Button>
                      <Button variant="ghost" size="sm">H1</Button>
                      <Button variant="ghost" size="sm">H2</Button>
                      <Button variant="ghost" size="sm">H3</Button>
                    </div>
                    <Textarea 
                      className="border-0 min-h-[100px]" 
                      placeholder="Comece a digitar..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Resultado</Label>
                  <div className="p-3 border rounded-lg bg-muted/50 text-sm text-muted-foreground">
                    Defina uma descrição para o produto para melhor visibilidade.
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mídia */}
            <Card>
              <CardHeader>
                <CardTitle>Mídia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">Clique para fazer upload ou arraste e solte</p>
                  <p className="text-sm text-muted-foreground">SVG, PNG, JPG ou GIF (MÁX. 800x400px)</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Miniatura */}
            <Card>
              <CardHeader>
                <CardTitle>Miniatura</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-primary/50 rounded-lg p-8 text-center bg-primary/5">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-primary">Arraste a miniatura aqui para fazer upload</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Defina a imagem de miniatura do produto. Apenas arquivos *.png, *.jpg e *.jpeg são aceitos
                </p>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Status</span>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status de Publicação *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Publicado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publish">Publicado</SelectItem>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="private">Privado</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Defina o status do produto.</p>
                </div>
              </CardContent>
            </Card>

            {/* Detalhes do Produto */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Produto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Categorias *</Label>
                  <div className="border rounded-lg p-3 text-sm text-muted-foreground">
                    Adicione o produto a uma categoria.
                  </div>
                  <Button variant="outline" size="sm" className="text-primary">
                    + Adicionar categoria selecionada
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="border rounded-lg p-3 text-sm text-muted-foreground">
                    Adicione tags para o produto.
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full">Salvar Produto</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddProduct;