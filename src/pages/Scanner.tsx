import React, { useState, useCallback } from 'react';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Scan, Search, Package, Plus, Check, Zap, BarChart3 } from "lucide-react";
import { toast } from 'sonner';

// Scanner Feature Imports
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

  // Handle scanner actions
  const handleScannerAction = useCallback((action: ScanAction, data?: any) => {
    console.log('🎯 Scanner action:', action, data);
    
    switch (action) {
      case ScanAction.VIEW:
        // Navigate to product detail
        toast.info('Abrindo detalhes do produto...');
        break;
      
      case ScanAction.EDIT_PRODUCT:
        // Navigate to product edit
        toast.info('Abrindo edição do produto...');
        break;
      
      case ScanAction.STOCK_IN:
      case ScanAction.STOCK_OUT:
      case ScanAction.STOCK_ADJUST:
        // Process stock movement
        toast.success('Movimentação processada com sucesso!');
        break;
      
      default:
        console.log('Unknown action:', action);
    }
  }, []);

  return (
    <DashboardLayout>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Scanner/Search/History */}
          <div className="lg:col-span-2">
            {activeView === 'scanner' && (
              <div className="space-y-6">
                {/* Scanner Core */}
                <ScannerCore
                  onScan={(result) => {
                    if (result.product) {
                      setSelectedProduct(result.product);
                    }
                  }}
                  onError={(error) => {
                    console.error('Scanner error:', error);
                    toast.error('Erro no scanner');
                  }}
                  isActive={scanner.state.isActive}
                  onToggle={() => {
                    if (scanner.state.isActive) {
                      scanner.actions.stopScanning();
                    } else {
                      scanner.actions.startScanning();
                    }
                  }}
                />

                {/* Manual Input */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      Busca Manual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Digite o código de barras manualmente:
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Digite o código de barras..."
                          value={manualCode}
                          onChange={(e) => setManualCode(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleManualSearch();
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={handleManualSearch}
                          disabled={!manualCode.trim() || scanner.state.isLoading}
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
    </DashboardLayout>
  );
};

export default Scanner;