import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Search, TrendingUp } from "lucide-react";
import { toast } from 'sonner';
import { SimpleMobileScanner } from "@/components/scanner/SimpleMobileScanner";
import { productService } from "@/features/scanner/services/ProductService";
import { ScannedProduct } from "@/features/scanner/types/scanner.types";

const Scanner = () => {
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [scanHistory, setScanHistory] = useState<{ code: string; timestamp: Date; product?: ScannedProduct }[]>([]);

  const handleScanResult = async (code: string) => {
    console.log('📱 Código escaneado:', code);
    
    try {
      // Buscar produto por código
      const product = await productService.getByBarcodeOrSku(code);
      
      const historyEntry = {
        code,
        timestamp: new Date(),
        product: product || undefined
      };
      
      setScanHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
      
      if (product) {
        setScannedProduct(product);
        toast.success(`Produto encontrado: ${product.nome}`);
        
        // Vibração de sucesso
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      } else {
        toast.error(`Produto não encontrado: ${code}`);
        setScannedProduct(null);
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar produto:', error);
      toast.error('Erro ao buscar produto');
      
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
        <SimpleMobileScanner 
          onScanResult={handleScanResult}
          onError={handleScanError}
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
                <Button size="sm" className="flex-1">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Ver Detalhes
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Search className="w-4 h-4 mr-2" />
                  Movimentar
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