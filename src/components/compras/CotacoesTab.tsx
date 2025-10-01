import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  FileText, 
  Calendar, 
  DollarSign, 
  Building, 
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  ShoppingCart,
  Upload,
  FileSpreadsheet
} from "lucide-react";
import { ProductSelectorShop } from "./ProductSelectorShop";
import { useCompras } from "@/hooks/useCompras";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from 'react-dropzone';
import { extrairImagensDoExcel, converterImagensParaDataURL } from '@/utils/excelImageExtractor';

interface CotacoesTabProps {
  cotacoes?: any[];
  onRefresh: () => void;
}

// Mock de cotações para demonstração
const mockCotacoes = [
  {
    id: '1',
    numero_cotacao: 'COT-001',
    descricao: 'Materiais de escritório',
    data_abertura: '2024-01-15',
    data_fechamento: null,
    status: 'aberta',
    valor_estimado: 2500.00,
    fornecedores_convidados: 3,
    propostas_recebidas: 1
  },
  {
    id: '2',
    numero_cotacao: 'COT-002',
    descricao: 'Equipamentos de informática',
    data_abertura: '2024-01-10',
    data_fechamento: '2024-01-20',
    status: 'fechada',
    valor_estimado: 15000.00,
    fornecedores_convidados: 5,
    propostas_recebidas: 4
  }
];

export const CotacoesTab: React.FC<CotacoesTabProps> = ({
  cotacoes = mockCotacoes,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showTestUpload, setShowTestUpload] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedImages, setProcessedImages] = useState([]);
  const { createCotacao } = useCompras();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    descricao: '',
    valor_estimado: 0,
    data_fechamento: '',
    observacoes: ''
  });

  const filteredCotacoes = cotacoes.filter(cotacao =>
    cotacao.numero_cotacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cotacao.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      aberta: { variant: "default" as const, label: "Aberta", icon: Clock },
      fechada: { variant: "secondary" as const, label: "Fechada", icon: CheckCircle },
      cancelada: { variant: "destructive" as const, label: "Cancelada", icon: AlertCircle }
    };
    
    const config = statusConfig[status] || statusConfig.aberta;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleCreateCotacao = async () => {
    if (!formData.descricao) {
      toast({
        title: "Erro",
        description: "A descrição é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    if (selectedProducts.length === 0) {
      toast({
        title: "Erro", 
        description: "Selecione pelo menos um produto para a cotação.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      // Gerar número da cotação único
      const numeroCotacao = `COT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      const cotacaoData = {
        numero_cotacao: numeroCotacao,
        descricao: formData.descricao,
        data_abertura: new Date().toISOString().split('T')[0],
        data_fechamento: formData.data_fechamento || null,
        status: 'aberta',
        observacoes: formData.observacoes || null
      };

      console.log('Salvando cotação:', cotacaoData);
      const result = await createCotacao(cotacaoData);
      
      if (result) {
        toast({
          title: "Sucesso",
          description: "Cotação criada com sucesso!",
        });
        
        // Limpar formulário
        setFormData({ descricao: '', valor_estimado: 0, data_fechamento: '', observacoes: '' });
        setSelectedProducts([]);
        setShowForm(false);
        onRefresh();
      }
    } catch (error) {
      console.error('Erro ao salvar cotação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a cotação.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // NOVA FUNCIONALIDADE - TESTE DE UPLOAD DE IMAGENS
  const onDropTestUpload = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      processExcelWithImages(file);
    }
  }, []);

  const { getRootProps: getTestUploadRootProps, getInputProps: getTestUploadInputProps, isDragActive: isTestUploadDragActive } = useDropzone({
    onDrop: onDropTestUpload,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  const processExcelWithImages = async (file: File) => {
    setIsProcessingImages(true);
    setUploadProgress(0);
    setProcessedImages([]);

    try {
      console.log('🔍 [TESTE] Iniciando teste de extração de imagens...');
      setUploadProgress(20);

      // PASSO 1: Extrair imagens por posição XML
      console.log('📸 [TESTE] PASSO 1: Extraindo imagens por posicionamento...');
      const imagensExtraidas = await extrairImagensDoExcel(file);
      console.log('📸 [TESTE] Imagens extraídas:', imagensExtraidas.length);
      setUploadProgress(50);

      // PASSO 2: Converter para Data URL
      console.log('🔄 [TESTE] PASSO 2: Convertendo imagens...');
      const imagensProcessadas = await converterImagensParaDataURL(imagensExtraidas);
      console.log('🔄 [TESTE] Imagens processadas:', imagensProcessadas.length);
      setUploadProgress(80);

      // PASSO 3: Salvar resultados
      setProcessedImages(imagensProcessadas);
      setUploadProgress(100);

      // DEBUG DETALHADO
      console.log('🎯 [TESTE] MAPEAMENTO FINAL:');
      imagensProcessadas.forEach((img, i) => {
        console.log(`  ${i + 1}. SKU: ${img.sku} → Imagem: ${img.nome}`);
      });

      toast({
        title: "Teste concluído!",
        description: `${imagensProcessadas.length} imagens extraídas e processadas com sucesso.`,
      });

    } catch (error) {
      console.error('❌ [TESTE] Erro no processamento:', error);
      toast({
        title: "Erro no teste",
        description: "Não foi possível processar o arquivo Excel.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingImages(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar cotações por número ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Nova Cotação
          </Button>
          
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={() => setShowTestUpload(true)}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Teste Upload Imagens
          </Button>
        </div>
      </div>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Cotações</p>
                <p className="text-2xl font-bold">{cotacoes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">
                  {cotacoes.filter(c => c.status === 'aberta').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Finalizadas</p>
                <p className="text-2xl font-bold">
                  {cotacoes.filter(c => c.status === 'fechada').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    cotacoes.reduce((total, c) => total + (c.valor_estimado || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Cotações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Cotações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cotação</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data Abertura</TableHead>
                <TableHead>Valor Estimado</TableHead>
                <TableHead>Propostas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCotacoes.map((cotacao) => (
                <TableRow key={cotacao.id}>
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {cotacao.numero_cotacao}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{cotacao.descricao}</p>
                      {cotacao.data_fechamento && (
                        <p className="text-sm text-muted-foreground">
                          Fechada em: {formatDate(cotacao.data_fechamento)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {formatDate(cotacao.data_abertura)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      {formatCurrency(cotacao.valor_estimado)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <p className="font-medium">
                        {cotacao.propostas_recebidas}/{cotacao.fornecedores_convidados}
                      </p>
                      <p className="text-xs text-muted-foreground">recebidas</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(cotacao.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCotacoes.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma cotação encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando sua primeira cotação'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Cotação
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para criar nova cotação */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl" aria-describedby="cotacao-dialog-description">
          <DialogHeader>
            <DialogTitle>Nova Cotação</DialogTitle>
            <DialogDescription id="cotacao-dialog-description">
              Preencha os dados para criar uma nova cotação nacional
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Ex: Materiais de escritório"
              />
            </div>
            
            <div>
              <Label htmlFor="valor_estimado">Valor Estimado</Label>
              <Input
                id="valor_estimado"
                type="number"
                step="0.01"
                value={formData.valor_estimado}
                onChange={(e) => setFormData({ ...formData, valor_estimado: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="data_fechamento">Data de Fechamento</Label>
              <Input
                id="data_fechamento"
                type="date"
                value={formData.data_fechamento}
                onChange={(e) => setFormData({ ...formData, data_fechamento: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais sobre a cotação..."
                rows={3}
              />
            </div>

            {/* Seletor de Produtos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Produtos para Cotação</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProductSelector(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Usar Seletor Avançado
                </Button>
              </div>
              
              {selectedProducts.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhum produto selecionado</p>
                  <Button 
                    onClick={() => setShowProductSelector(true)}
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Selecionar Produtos
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{product.nome}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>SKU: {product.sku_interno}</span>
                          <span>Qtd: {product.quantidade}</span>
                          <span>Preço: R$ {product.preco_custo.toFixed(2)}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProducts(prev => prev.filter((_, i) => i !== index));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="text-right text-sm font-medium">
                    Total: R$ {selectedProducts.reduce((sum, p) => sum + (p.preco_custo * p.quantidade), 0).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleCreateCotacao}
                disabled={!formData.descricao || selectedProducts.length === 0 || saving}
              >
                {saving ? 'Salvando...' : 'Criar Cotação'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowForm(false);
                  setFormData({ descricao: '', valor_estimado: 0, data_fechamento: '', observacoes: '' });
                  setSelectedProducts([]);
                }}
                disabled={saving}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para testar upload de imagens */}
      <Dialog open={showTestUpload} onOpenChange={setShowTestUpload}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Teste de Extração de Imagens Excel
            </DialogTitle>
            <DialogDescription>
              Teste nossa implementação melhorada de extração de imagens por posicionamento XML
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Upload Area */}
            <div
              {...getTestUploadRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isTestUploadDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getTestUploadInputProps()} />
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">
                {isTestUploadDragActive 
                  ? 'Solte o arquivo Excel aqui...' 
                  : 'Arraste um arquivo Excel ou clique para selecionar'
                }
              </p>
              <p className="text-sm text-muted-foreground">
                Formatos aceitos: .xlsx, .xls (com imagens incorporadas)
              </p>
            </div>

            {/* Progresso de processamento */}
            {isProcessingImages && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processando imagens...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Resultados do processamento */}
            {processedImages.length > 0 && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Sucesso!</strong> {processedImages.length} imagens extraídas e mapeadas corretamente.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {processedImages.map((img, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                          <img 
                            src={img.url} 
                            alt={`Produto ${img.sku}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">SKU: {img.sku}</p>
                          <p className="text-xs text-muted-foreground">Nome: {img.nome}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowTestUpload(false);
                  setProcessedImages([]);
                  setUploadProgress(0);
                }}
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Seletor de Produtos */}
      <ProductSelectorShop
        isOpen={showProductSelector}
        onOpenChange={setShowProductSelector}
        onSelectProducts={setSelectedProducts}
        selectedProducts={selectedProducts}
      />
    </div>
  );
};