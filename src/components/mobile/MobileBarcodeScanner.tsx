import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, QrCode, Zap, Package, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useMobile } from '@/contexts/MobileContext';
import { BarcodeFormat, BrowserMultiFormatReader } from '@zxing/library';

interface ScanResult {
  id: string;
  code: string;
  format: string;
  timestamp: Date;
  productInfo?: {
    name: string;
    price: number;
    stock: number;
    image?: string;
  };
}

export const MobileBarcodeScanner: React.FC = () => {
  const { vibrate, showNotification } = useMobile();
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [manualCode, setManualCode] = useState('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  const codeReader = new BrowserMultiFormatReader();

  const startScanning = async () => {
    try {
      setIsScanning(true);
      vibrate('light');
      
      const videoElement = document.getElementById('scanner-video') as HTMLVideoElement;
      if (!videoElement) return;

      // Get camera permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setCameraStream(stream);
      videoElement.srcObject = stream;
      
      // Start scanning
      codeReader.decodeFromVideoDevice(undefined, videoElement, (result, error) => {
        if (result) {
          handleScanResult(result.getText(), result.getBarcodeFormat().toString());
          stopScanning();
        }
        
        if (error && error.name !== 'NotFoundException') {
          console.error('Scan error:', error);
        }
      });
      
    } catch (error) {
      console.error('Error starting scanner:', error);
      showNotification('Erro', 'Não foi possível acessar a câmera');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    codeReader.reset();
    
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    
    const videoElement = document.getElementById('scanner-video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.srcObject = null;
    }
  };

  const handleScanResult = (code: string, format: string) => {
    vibrate('medium');
    
    // Simulate product lookup
    const mockProductInfo = {
      name: `Produto ${code.slice(-4)}`,
      price: Math.floor(Math.random() * 10000) / 100,
      stock: Math.floor(Math.random() * 100),
      image: undefined
    };

    const scanResult: ScanResult = {
      id: Date.now().toString(),
      code,
      format,
      timestamp: new Date(),
      productInfo: mockProductInfo
    };

    setScanHistory(prev => [scanResult, ...prev.slice(0, 9)]); // Keep last 10 scans
    showNotification('Código Escaneado', `${format}: ${code}`);
  };

  const handleManualEntry = () => {
    if (manualCode.trim()) {
      handleScanResult(manualCode.trim(), 'MANUAL');
      setManualCode('');
      vibrate('light');
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('pt-BR', {
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

  useEffect(() => {
    return () => {
      if (isScanning) {
        stopScanning();
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Scanner Controls */}
      <Card className="p-4">
        <div className="text-center space-y-4">
          <h3 className="font-semibold text-lg">Scanner de Código de Barras</h3>
          
          {/* Camera View */}
          <div className="relative">
            <video
              id="scanner-video"
              className={`
                w-full h-48 bg-black rounded-lg object-cover
                ${isScanning ? 'block' : 'hidden'}
              `}
              autoPlay
              playsInline
            />
            
            {!isScanning && (
              <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                <QrCode className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
            
            {/* Scanning overlay */}
            {isScanning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 border-2 border-primary rounded-lg"
              >
                <motion.div
                  animate={{ y: [0, 180, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-full h-0.5 bg-primary absolute top-0"
                />
              </motion.div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2 justify-center">
            <Button
              onClick={isScanning ? stopScanning : startScanning}
              size="lg"
              variant={isScanning ? "destructive" : "default"}
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-2" />
              {isScanning ? 'Parar Scanner' : 'Iniciar Scanner'}
            </Button>
          </div>

          {/* Manual Entry */}
          <div className="flex gap-2">
            <Input
              placeholder="Digite o código manualmente"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualEntry()}
            />
            <Button onClick={handleManualEntry} disabled={!manualCode.trim()}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Histórico de Escaneamentos</h4>
            <Badge variant="secondary">{scanHistory.length}</Badge>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {scanHistory.map((scan) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 border rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {scan.format}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(scan.timestamp)}
                      </span>
                    </div>
                    
                    <div className="font-mono text-sm mb-2">
                      {scan.code}
                    </div>
                    
                    {scan.productInfo && (
                      <div className="text-sm">
                        <div className="font-medium flex items-center">
                          <Package className="w-3 h-3 mr-1" />
                          {scan.productInfo.name}
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>{formatPrice(scan.productInfo.price)}</span>
                          <span>{scan.productInfo.stock} em estoque</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <Zap className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};