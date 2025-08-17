// =============================================================================
// SCANNER V2 - Nova implementação com inicialização segura
// =============================================================================

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Camera, 
  Scan, 
  Zap, 
  RotateCcw, 
  Upload, 
  Keyboard,
  Play,
  Pause,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { duplicateGuard } from '@/features/scanner/utils/duplicateGuard';
import { productService } from '@/features/scanner/services/ProductService';
import { movementService } from '@/features/scanner/services/MovementService';
import { ScannedProduct } from '@/features/scanner/types/scanner.types';

// Schema para validação de código manual
const barcodeSchema = z.string()
  .min(4, 'Código deve ter pelo menos 4 caracteres')
  .max(50, 'Código muito longo')
  .regex(/^[a-zA-Z0-9\-_]+$/, 'Código contém caracteres inválidos');

interface ScannerV2Props {
  onProductFound?: (product: ScannedProduct) => void;
  onError?: (error: string) => void;
}

export const ScannerV2: React.FC<ScannerV2Props> = ({
  onProductFound,
  onError
}) => {
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<ScannedProduct | null>(null);
  const [scanHistory, setScanHistory] = useState<{ code: string; timestamp: Date; found: boolean }[]>([]);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [currentCamera, setCurrentCamera] = useState<string>('');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [manualCode, setManualCode] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  // Load preferred camera from localStorage
  useEffect(() => {
    const savedCamera = localStorage.getItem('scanner-preferred-camera');
    if (savedCamera) {
      setCurrentCamera(savedCamera);
    }
  }, []);

  /**
   * Inicializar scanner com ambiente seguro
   */
  const initializeScanner = async () => {
    console.log('🚀 [ScannerV2] Initializing...');

    // Check secure context
    if (!(window.isSecureContext || location.hostname === 'localhost')) {
      const message = 'Use HTTPS ou localhost para acessar a câmera';
      toast.error(message);
      onError?.(message);
      return;
    }

    try {
      // Dynamic import of ZXing
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      readerRef.current = new BrowserMultiFormatReader();

      // Get available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);

      // Select default camera (back camera preferred)
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('environment')
      );
      const selectedCamera = currentCamera || backCamera?.deviceId || videoDevices[0]?.deviceId;
      
      if (selectedCamera) {
        setCurrentCamera(selectedCamera);
        localStorage.setItem('scanner-preferred-camera', selectedCamera);
      }

      setIsInitialized(true);
      toast.success('Scanner inicializado com sucesso');
      console.log('✅ [ScannerV2] Initialized successfully');

    } catch (error: any) {
      console.error('❌ [ScannerV2] Initialization failed:', error);
      const message = 'Erro ao inicializar scanner';
      toast.error(message);
      onError?.(message);
    }
  };

  /**
   * Iniciar escaneamento
   */
  const startScanning = async () => {
    if (!isInitialized || !readerRef.current) {
      await initializeScanner();
      return;
    }

    try {
      console.log('📷 [ScannerV2] Starting camera...');

      // Request camera with specific constraints
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: currentCamera ? { exact: currentCamera } : undefined,
          facingMode: currentCamera ? undefined : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Start decoding
      setIsScanning(true);
      setIsPaused(false);
      
      readerRef.current.decodeFromVideoDevice(
        currentCamera || undefined,
        videoRef.current,
        handleScanResult
      );

      console.log('✅ [ScannerV2] Scanning started');

    } catch (error: any) {
      console.error('❌ [ScannerV2] Failed to start scanning:', error);
      toast.error('Erro ao acessar câmera');
      onError?.('Erro ao acessar câmera');
    }
  };

  /**
   * Parar escaneamento
   */
  const stopScanning = () => {
    console.log('🛑 [ScannerV2] Stopping scanner...');

    // Stop reader
    if (readerRef.current) {
      readerRef.current.reset();
    }

    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
    setIsPaused(false);
    setTorchEnabled(false);
  };

  /**
   * Pausar/Retomar scanner
   */
  const togglePause = () => {
    if (isPaused) {
      if (readerRef.current && videoRef.current) {
        readerRef.current.decodeFromVideoDevice(
          currentCamera || undefined,
          videoRef.current,
          handleScanResult
        );
      }
      setIsPaused(false);
    } else {
      if (readerRef.current) {
        readerRef.current.reset();
      }
      setIsPaused(true);
    }
  };

  /**
   * Trocar câmera
   */
  const switchCamera = async () => {
    if (availableCameras.length < 2) return;

    const currentIndex = availableCameras.findIndex(cam => cam.deviceId === currentCamera);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];

    setCurrentCamera(nextCamera.deviceId);
    localStorage.setItem('scanner-preferred-camera', nextCamera.deviceId);

    if (isScanning) {
      stopScanning();
      // Wait a bit before restarting
      setTimeout(() => {
        startScanning();
      }, 500);
    }
  };

  /**
   * Toggle flash/torch
   */
  const toggleTorch = async () => {
    if (!streamRef.current) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;

      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !torchEnabled } as any]
        });
        setTorchEnabled(!torchEnabled);
      } else {
        toast.warning('Flash não suportado neste dispositivo');
      }
    } catch (error) {
      console.error('❌ [ScannerV2] Torch toggle failed:', error);
      toast.error('Erro ao controlar flash');
    }
  };

  /**
   * Processar resultado do scan
   */
  const handleScanResult = useCallback(async (result: any, error: any) => {
    if (error) {
      // Ignore common scanning errors
      return;
    }

    if (!result || isPaused) return;

    const code = result.getText();
    console.log(`📱 [ScannerV2] Code detected: ${code}`);

    // Check for duplicates
    if (duplicateGuard.isDuplicate(code)) {
      return;
    }

    // Add to history
    setScanHistory(prev => [
      { code, timestamp: new Date(), found: false },
      ...prev.slice(0, 9) // Keep last 10
    ]);

    // Vibration feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(200);
    }

    try {
      // Look up product
      const product = await productService.getByBarcodeOrSku(code);
      
      if (product) {
        setCurrentProduct(product);
        setScanHistory(prev => prev.map((item, index) => 
          index === 0 ? { ...item, found: true } : item
        ));
        
        onProductFound?.(product);
        toast.success(`Produto encontrado: ${product.nome}`);
        
        // Success vibration
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      } else {
        toast.error(`Produto não encontrado: ${code}`);
        
        // Error vibration
        if ('vibrate' in navigator) {
          navigator.vibrate(400);
        }
      }
    } catch (error: any) {
      console.error('❌ [ScannerV2] Product lookup failed:', error);
      toast.error('Erro ao buscar produto');
      onError?.('Erro ao buscar produto');
    }
  }, [isPaused, onProductFound, onError]);

  /**
   * Upload e decodificação de imagem
   */
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !readerRef.current) return;

    try {
      const result = await readerRef.current.decodeFromImageUrl(URL.createObjectURL(file));
      const code = result.getText();
      
      // Process like normal scan
      const product = await productService.getByBarcodeOrSku(code);
      if (product) {
        setCurrentProduct(product);
        onProductFound?.(product);
        toast.success(`Produto encontrado: ${product.nome}`);
      } else {
        toast.error(`Produto não encontrado: ${code}`);
      }
    } catch (error) {
      console.error('❌ [ScannerV2] Image decode failed:', error);
      toast.error('Não foi possível ler código da imagem');
    }

    // Clear file input
    event.target.value = '';
  };

  /**
   * Entrada manual de código
   */
  const handleManualEntry = async () => {
    try {
      const validCode = barcodeSchema.parse(manualCode);
      
      const product = await productService.getByBarcodeOrSku(validCode);
      if (product) {
        setCurrentProduct(product);
        onProductFound?.(product);
        toast.success(`Produto encontrado: ${product.nome}`);
      } else {
        toast.error(`Produto não encontrado: ${validCode}`);
      }
      
      setManualCode('');
      setIsManualModalOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      } else {
        toast.error('Erro ao buscar produto');
      }
    }
  };

  /**
   * Movimentação rápida
   */
  const handleQuickMove = async (type: 'entrada' | 'saida', quantity = 1) => {
    if (!currentProduct) {
      toast.warning('Escaneie um produto primeiro');
      return;
    }

    try {
      const result = await movementService.quickMove({
        sku: currentProduct.sku_interno,
        qty: quantity,
        type,
        motivo: `Scanner V2 - ${type}`,
        observacoes: 'Via Scanner Mobile'
      });

      if (result.success) {
        toast.success(`${type === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
        
        // Update product quantity in UI
        setCurrentProduct(prev => prev ? {
          ...prev,
          quantidade_atual: result.new_quantity || prev.quantidade_atual
        } : null);
      } else {
        toast.error(result.error || 'Erro na movimentação');
      }
    } catch (error: any) {
      console.error('❌ [ScannerV2] Quick move failed:', error);
      toast.error('Erro ao processar movimentação');
    }
  };

  return (
    <div className="space-y-6">
      {/* Scanner Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Scan className="w-5 h-5" />
              Scanner V2
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {isScanning && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {isPaused ? 'Pausado' : 'Ativo'}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Video Container */}
          <div className="relative aspect-video bg-muted/20 rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/50">
            {isScanning ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                
                {/* Scan Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Scan Area */}
                  <div className="absolute inset-4 border-2 border-primary/50 rounded-lg">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  </div>

                  {/* Scan Line */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-1 bg-primary/70 animate-pulse shadow-lg" />
                  </div>

                  {/* Pause Overlay */}
                  {isPaused && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-lg font-medium">Scanner Pausado</div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">
                    Scanner de Códigos
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Clique em "Iniciar Scanner" para começar
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            {!isScanning ? (
              <Button onClick={startScanning} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Iniciar Scanner
              </Button>
            ) : (
              <>
                <Button onClick={togglePause} variant="outline">
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                
                <Button onClick={stopScanning} variant="outline">
                  Parar
                </Button>
              </>
            )}

            {/* Camera Switch */}
            {availableCameras.length > 1 && (
              <Button variant="outline" onClick={switchCamera}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}

            {/* Torch */}
            {isScanning && (
              <Button 
                variant="outline" 
                onClick={toggleTorch}
                className={torchEnabled ? 'bg-yellow-100' : ''}
              >
                <Zap className={`w-4 h-4 ${torchEnabled ? 'text-yellow-600' : ''}`} />
              </Button>
            )}

            {/* Manual Entry */}
            <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Keyboard className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Digitar Código</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Digite o código de barras..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualEntry()}
                  />
                  <Button onClick={handleManualEntry} className="w-full">
                    Buscar Produto
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Upload Image */}
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4" />
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

      {/* Current Product */}
      {currentProduct && (
        <Card>
          <CardHeader>
            <CardTitle>Produto Escaneado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{currentProduct.nome}</h3>
                <p className="text-sm text-muted-foreground">SKU: {currentProduct.sku_interno}</p>
                <p className="text-sm text-muted-foreground">
                  Estoque: {currentProduct.quantidade_atual} unidades
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  size="sm"
                  onClick={() => handleQuickMove('entrada')}
                  className="flex-1"
                >
                  +1 Entrada
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickMove('saida')}
                  className="flex-1"
                >
                  -1 Saída
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scanHistory.map((scan, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <code className="text-sm">{scan.code}</code>
                  <div className="flex items-center gap-2">
                    <Badge variant={scan.found ? 'default' : 'destructive'}>
                      {scan.found ? 'Encontrado' : 'Não encontrado'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {scan.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};