import React, { useState, useCallback } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Scan, Search, Package, Plus, Check, Zap, BarChart3 } from "lucide-react";
import { toast } from 'sonner';
import { InstallPrompt } from "@/components/ui/InstallPrompt";
import { stockMovementService } from "@/features/scanner/services/StockMovementService";

// Feature Flags
import { FEATURES } from "@/config/features";

// Scanner V2 Components  
import { ScannerV2 } from "@/components/scanner/ScannerV2";
import { ScannerFallback } from "@/components/scanner/ScannerFallback";

// Legacy Scanner Imports (fallback)
import { useScannerCore } from "@/features/scanner/hooks/useScannerCore";
import { ScannerCore } from "@/features/scanner/components/ScannerCore";
import { ScannerSearch } from "@/features/scanner/components/ScannerSearch";
import { ScannerHistory } from "@/features/scanner/components/ScannerHistory";
import { ScannerActions } from "@/features/scanner/components/ScannerActions";
import { ScannedProduct, ScanAction, ScannerError } from "@/features/scanner/types/scanner.types";

const Scanner = () => {
  const [manualCode, setManualCode] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ScannedProduct | null>(null);
  const [activeView, setActiveView] = useState<'scanner' | 'search' | 'history'>('scanner');
  const [scannerInitFailed, setScannerInitFailed] = useState(false);

  // Main scanner hook
  const scanner = useScannerCore({
    enableContinuousMode: true,
    enableSound: true,
    enableVibration: true,
    onScanSuccess: (result) => {
      console.log('✅ Scan successful:', result);
      if (result.product) {
        setSelectedProduct(result.product);
      }
    },
    onScanError: (error) => {
      console.error('❌ Scan error:', error);
    },
    onProductFound: (product) => {
      console.log('✅ Product found:', product);
      setSelectedProduct(product);
    },
    onProductNotFound: (code) => {
      console.warn('⚠️ Product not found:', code);
      toast.error(`Produto não encontrado: ${code}`);
    }
  });

  // Handle manual code search
  const handleManualSearch = useCallback(async () => {
    if (!manualCode.trim()) return;
    
    try {
      await scanner.actions.scanBarcode(manualCode.trim());
      setManualCode("");
    } catch (error) {
      console.error('❌ Manual search failed:', error);
      toast.error('Erro ao buscar produto');
    }
  }, [manualCode, scanner.actions]);

  // Handle product selection from search
  const handleProductSelect = useCallback((product: ScannedProduct) => {
    setSelectedProduct(product);
    setActiveView('scanner');
  }, []);

  // Handle scanner actions with real stock integration
  const handleScannerAction = useCallback(async (action: ScanAction, data?: any) => {
    console.log('🎯 Scanner action:', action, data);
    
    if (!selectedProduct) {
      toast.warning('Selecione um produto primeiro');
      return;
    }
    
    switch (action) {
      case ScanAction.VIEW:
        // Navigate to product detail
        window.open(`/produtos/${selectedProduct.id}`, '_blank');
        break;
      
      case ScanAction.EDIT_PRODUCT:
        // Navigate to product edit
        window.open(`/produtos/${selectedProduct.id}/edit`, '_blank');
        break;
      
      case ScanAction.STOCK_IN:
        const quantity = prompt('Quantidade para entrada:', '1');
        if (quantity && parseInt(quantity) > 0) {
          const result = await stockMovementService.processStockIn({
            produto_id: selectedProduct.id,
            tipo: 'entrada',
            quantidade: parseInt(quantity),
            motivo: 'Entrada via Scanner',
            observacoes: 'Processado via scanner mobile'
          });
          
          if (result.success) {
            toast.success('Entrada de estoque registrada!');
          } else {
            toast.error(result.error || 'Erro ao processar entrada');
          }
        }
        break;
      
      case ScanAction.STOCK_OUT:
        const outQuantity = prompt('Quantidade para saída:', '1');
        if (outQuantity && parseInt(outQuantity) > 0) {
          const result = await stockMovementService.processStockOut({
            produto_id: selectedProduct.id,
            tipo: 'saida',
            quantidade: parseInt(outQuantity),
            motivo: 'Saída via Scanner',
            observacoes: 'Processado via scanner mobile'
          });
          
          if (result.success) {
            toast.success('Saída de estoque registrada!');
          } else {
            toast.error(result.error || 'Erro ao processar saída');
          }
        }
        break;
      
      case ScanAction.STOCK_ADJUST:
        const newQuantity = prompt('Nova quantidade:', '0');
        if (newQuantity !== null) {
          const result = await stockMovementService.processStockAdjustment({
            produto_id: selectedProduct.id,
            tipo: 'ajuste',
            quantidade: parseInt(newQuantity),
            motivo: 'Ajuste via Scanner',
            observacoes: 'Ajuste realizado via scanner mobile'
          });
          
          if (result.success) {
            toast.success('Ajuste de estoque realizado!');
          } else {
            toast.error(result.error || 'Erro ao processar ajuste');
          }
        }
        break;
      
      default:
        console.log('Unknown action:', action);
    }
  }, [selectedProduct]);

  return (
    <>
      <div className="p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Scanner de Código de Barras</h1>
            <p className="text-muted-foreground">
              Leia códigos de barras para gerenciar seu estoque em tempo real
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {scanner.state.isActive && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Scanner Ativo
              </Badge>
            )}
            <Badge variant="outline">
              {scanner.state.sessionStats.scans_successful} sucessos hoje
            </Badge>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <Button
            variant={activeView === 'scanner' ? 'default' : 'outline'}
            onClick={() => setActiveView('scanner')}
          >
            <Scan className="w-4 h-4 mr-2" />
            Scanner
          </Button>
          <Button
            variant={activeView === 'search' ? 'default' : 'outline'}
            onClick={() => setActiveView('search')}
          >
            <Search className="w-4 h-4 mr-2" />
            Buscar
          </Button>
          <Button
            variant={activeView === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveView('history')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Histórico
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Left Column - Scanner/Search/History */}
          <div className="lg:col-span-2">
            {activeView === 'scanner' && (
              <div className="space-y-6">
                {/* Scanner V2 or Fallback */}
                {FEATURES.SCANNER_V2 && !scannerInitFailed ? (
                  <ScannerV2
                    onProductFound={(product) => {
                      setSelectedProduct(product);
                    }}
                    onError={(error) => {
                      console.error('Scanner V2 error:', error);
                      // If initialization fails, switch to fallback
                      if (error.includes('inicializar') || error.includes('câmera')) {
                        setScannerInitFailed(true);
                        toast.warning('Usando modo alternativo do scanner');
                      }
                    }}
                  />
                ) : (
                  <ScannerFallback
                    onProductFound={(product) => {
                      setSelectedProduct(product);
                    }}
                    onError={(error) => {
                      console.error('Scanner fallback error:', error);
                    }}
                  />
                )}

                {/* Manual Input - Legacy fallback */}
                {scannerInitFailed && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Busca Manual (Alternativa)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Digite o código de barras manualmente:
                        </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            placeholder="Digite o código de barras..."
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleManualSearch();
                              }
                            }}
                            className="w-full sm:flex-1"
                          />
                          <Button
                            variant="outline"
                            onClick={handleManualSearch}
                            disabled={!manualCode.trim()}
                            className="w-full sm:w-auto"
                          >
                            <Search className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeView === 'search' && (
              <ScannerSearch
                onProductSelect={handleProductSelect}
              />
            )}

            {activeView === 'history' && (
              <ScannerHistory />
            )}
          </div>

          {/* Right Column - Actions */}
          <div>
            <ScannerActions
              product={selectedProduct || undefined}
              onAction={handleScannerAction}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => {
                  if (selectedProduct) {
                    handleScannerAction(ScanAction.STOCK_IN);
                  } else {
                    toast.warning('Selecione um produto primeiro');
                  }
                }}
              >
                <Plus className="w-6 h-6" />
                <span>Entrada de Estoque</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => {
                  if (selectedProduct) {
                    handleScannerAction(ScanAction.STOCK_OUT);
                  } else {
                    toast.warning('Selecione um produto primeiro');
                  }
                }}
              >
                <Package className="w-6 h-6" />
                <span>Saída de Estoque</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => {
                  if (selectedProduct) {
                    handleScannerAction(ScanAction.STOCK_CHECK);
                  } else {
                    toast.warning('Selecione um produto primeiro');
                  }
                }}
              >
                <Check className="w-6 h-6" />
                <span>Conferência</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => setActiveView('search')}
              >
                <Search className="w-6 h-6" />
                <span>Consultar Produto</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Session Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Estatísticas da Sessão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {scanner.state.sessionStats.scans_attempted}
                </div>
                <div className="text-sm text-muted-foreground">Tentativas</div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {scanner.state.sessionStats.scans_successful}
                </div>
                <div className="text-sm text-muted-foreground">Sucessos</div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {scanner.state.sessionStats.unique_products}
                </div>
                <div className="text-sm text-muted-foreground">Produtos Únicos</div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.floor(scanner.state.sessionStats.session_duration / 60)}m
                </div>
                <div className="text-sm text-muted-foreground">Duração</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Scanner;