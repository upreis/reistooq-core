// =============================================================================
// SCANNER FALLBACK - Alternativa quando scanner principal falha
// =============================================================================

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Keyboard, Search } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { productService } from '@/features/scanner/services/ProductService';
import { ScannedProduct } from '@/features/scanner/types/scanner.types';

const barcodeSchema = z.string()
  .min(4, 'Código deve ter pelo menos 4 caracteres')
  .max(50, 'Código muito longo')
  .regex(/^[a-zA-Z0-9\-_]+$/, 'Código contém caracteres inválidos');

interface ScannerFallbackProps {
  onProductFound?: (product: ScannedProduct) => void;
  onError?: (error: string) => void;
}

export const ScannerFallback: React.FC<ScannerFallbackProps> = ({
  onProductFound,
  onError
}) => {
  const [manualCode, setManualCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Busca manual por código
   */
  const handleManualSearch = async () => {
    if (!manualCode.trim()) return;

    try {
      const validCode = barcodeSchema.parse(manualCode.trim());
      setIsLoading(true);

      const product = await productService.getByBarcodeOrSku(validCode);
      
      if (product) {
        onProductFound?.(product);
        toast.success(`Produto encontrado: ${product.nome}`);
        setManualCode('');
      } else {
        toast.error(`Produto não encontrado: ${validCode}`);
        onError?.(`Produto não encontrado: ${validCode}`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      } else {
        console.error('❌ [ScannerFallback] Manual search failed:', error);
        toast.error('Erro ao buscar produto');
        onError?.('Erro ao buscar produto');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Upload e decodificação de imagem
   */
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      
      // Dynamic import of ZXing for image decoding
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      
      const result = await reader.decodeFromImageUrl(URL.createObjectURL(file));
      const code = result.getText();
      
      console.log(`📷 [ScannerFallback] Decoded from image: ${code}`);
      
      // Look up product
      const product = await productService.getByBarcodeOrSku(code);
      
      if (product) {
        onProductFound?.(product);
        toast.success(`Produto encontrado: ${product.nome}`);
      } else {
        toast.error(`Produto não encontrado: ${code}`);
        onError?.(`Produto não encontrado: ${code}`);
      }
    } catch (error: any) {
      console.error('❌ [ScannerFallback] Image decode failed:', error);
      toast.error('Não foi possível ler código da imagem');
      onError?.('Erro ao processar imagem');
    } finally {
      setIsLoading(false);
      // Clear file input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning Card */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              ⚠️
            </div>
            <div>
              <h4 className="font-medium text-yellow-800">Scanner não disponível</h4>
              <p className="text-sm text-yellow-700">
                Use as opções abaixo para buscar produtos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Entrada Manual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Código de Barras ou SKU
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Digite o código..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={handleManualSearch}
                disabled={!manualCode.trim() || isLoading}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload de Imagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Faça upload de uma foto do código de barras
            </p>
            
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Selecionar Imagem
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Dicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm space-y-1">
            <p>• Use HTTPS ou localhost para acessar a câmera</p>
            <p>• Certifique-se de que o código de barras está nítido na foto</p>
            <p>• Formatos suportados: CODE_128, EAN-13, QR Code, etc.</p>
            <p>• Digite códigos com pelo menos 4 caracteres</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};