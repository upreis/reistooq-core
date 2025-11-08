// 🛡️ PÁGINA PROTEGIDA - NÃO MODIFICAR SEM AUTORIZAÇÃO EXPLÍCITA
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Search, TrendingUp } from "lucide-react";
import { toast } from 'sonner';
import { MobileScanner } from "@/components/scanner/MobileScanner";
import { ProductModal } from "@/components/estoque/ProductModal";
import { productService } from "@/features/scanner/services/ProductService";
import { ScannedProduct } from "@/features/scanner/types/scanner.types";
import { useProducts, Product } from "@/hooks/useProducts";

const Scanner = () => {
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [scanHistory, setScanHistory] = useState<{ code: string; timestamp: Date; product?: ScannedProduct }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [scannedCode, setScannedCode] = useState<string>("");
  const { getProducts } = useProducts();

  const findProductByCode = async (code: string): Promise<Product | null> => {
    try {
      console.log('🔍 Buscando produto por código:', code);
      
      // Busca direta no banco por código de barras ou SKU
      const products = await getProducts({
        search: code,
        limit: 10
      });
      
      // Encontrar produto que tenha exatamente esse código
      const exactMatch = products.find(p => 
        p.codigo_barras === code || p.sku_interno === code
      );
      
      console.log(exactMatch ? '✅ Produto encontrado!' : '❌ Produto não encontrado');
      return exactMatch || null;
      
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return null;
    }
  };

  const handleScanResult = async (code: string) => {
    console.log('📱 Código escaneado:', code);
    setScannedCode(code);
    
    try {
      // Buscar produto diretamente no banco
      const existingProduct = await findProductByCode(code);
      
      if (existingProduct) {
        // Produto existe - abrir modal para editar
        setCurrentProduct(existingProduct);
        setScannedProduct({
          id: existingProduct.id,
          nome: existingProduct.nome,
          sku_interno: existingProduct.sku_interno,
          codigo_barras: existingProduct.codigo_barras || '',
          quantidade_atual: existingProduct.quantidade_atual,
          estoque_minimo: existingProduct.estoque_minimo,
          estoque_maximo: existingProduct.estoque_maximo,
          preco_venda: existingProduct.preco_venda || 0,
          preco_custo: existingProduct.preco_custo || 0,
          localizacao: existingProduct.localizacao || '',
          descricao: existingProduct.descricao || '',
          url_imagem: existingProduct.url_imagem || '',
          categoria: existingProduct.categoria || '',
          ativo: existingProduct.ativo,
          created_at: existingProduct.created_at,
          updated_at: existingProduct.updated_at,
          organization_id: existingProduct.organization_id
        });
        setIsModalOpen(true);
        toast.success(`Produto encontrado: ${existingProduct.nome} - Toque para editar`);
        
        // Vibração de sucesso
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      } else {
        // Produto não existe - abrir modal para criar novo com código preenchido
        setCurrentProduct(null);
        setScannedProduct(null);
        setIsModalOpen(true);
        toast.success(`Código: ${code} - Criar novo produto`);
      }
      
      // Adicionar ao histórico
      const historyEntry = {
        code,
        timestamp: new Date(),
        product: existingProduct ? {
          id: existingProduct.id,
          nome: existingProduct.nome,
          sku_interno: existingProduct.sku_interno,
          quantidade_atual: existingProduct.quantidade_atual,
          preco_venda: existingProduct.preco_venda || 0
        } as ScannedProduct : undefined
      };
      
      setScanHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
      
    } catch (error: any) {
      console.error('❌ Erro ao processar código:', error);
      toast.error('Erro ao processar código');
      
      // Adicionar ao histórico mesmo com erro
      setScanHistory(prev => [{
        code,
        timestamp: new Date()
      }, ...prev.slice(0, 9)]);
    }
  };

  const handleScanError = (error: string) => {
    toast.error(error);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleModalSuccess = async () => {
    // Feedback visual claro para mobile
    const wasCreating = !currentProduct;
    
    setIsModalOpen(false);
    setCurrentProduct(null);
    setScannedProduct(null);
    
    // Toast de sucesso com vibração
    if (wasCreating) {
      toast.success('✅ Produto criado com sucesso!', {
        duration: 3000,
      });
    } else {
      toast.success('✅ Produto atualizado com sucesso!', {
        duration: 3000,
      });
    }
    
    // Vibração de confirmação
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Scanner Mobile</h1>
          <p className="text-muted-foreground text-sm">
            Escaneie códigos de barras para consultar produtos
          </p>
        </div>

        {/* Scanner Component */}
        <MobileScanner 
          onScanResult={handleScanResult}
          onError={handleScanError}
        />

        {/* Modal do Produto */}
        <ProductModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          product={currentProduct}
          onSuccess={handleModalSuccess}
          initialBarcode={!currentProduct ? scannedCode : undefined}
        />

        {/* Product Info */}
        {scannedProduct && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-primary" />
                Produto Encontrado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{scannedProduct.nome}</h3>
                <p className="text-sm text-muted-foreground">
                  SKU: {scannedProduct.sku_interno}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Preço</p>
                  <p className="font-semibold text-lg">
                    {formatPrice(scannedProduct.preco_venda || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estoque</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg">
                      {scannedProduct.quantidade_atual}
                    </p>
                    <Badge 
                      variant={scannedProduct.quantidade_atual > 0 ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {scannedProduct.quantidade_atual > 0 ? "Disponível" : "Sem estoque"}
                    </Badge>
                  </div>
                </div>
              </div>

              {scannedProduct.descricao && (
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="text-sm">{scannedProduct.descricao}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setIsModalOpen(true)}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Editar Produto
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                Histórico de Escaneamentos
                <Badge variant="secondary">{scanHistory.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {scanHistory.map((scan, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {scan.code}
                        </code>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(scan.timestamp)}
                        </span>
                      </div>
                      
                      {scan.product ? (
                        <div className="text-sm">
                          <p className="font-medium text-primary">{scan.product.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            Estoque: {scan.product.quantidade_atual}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Produto não encontrado
                        </p>
                      )}
                    </div>
                    
                    <Badge 
                      variant={scan.product ? "secondary" : "outline"}
                      className="ml-2"
                    >
                      {scan.product ? "✓" : "✗"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-muted/20">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <h4 className="font-medium">Como usar:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>1. Toque em "Iniciar Scanner"</p>
                <p>2. Permita o acesso à câmera</p>
                <p>3. Aponte para o código de barras</p>
                <p>4. Aguarde o reconhecimento automático</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Scanner;