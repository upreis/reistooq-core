import React, { useState, useRef, useEffect } from 'react';
import { Camera, Search, X, Flashlight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface SimpleMobileScannerProps {
  onScanResult?: (code: string) => void;
  onError?: (error: string) => void;
}

export const SimpleMobileScanner: React.FC<SimpleMobileScannerProps> = ({
  onScanResult,
  onError
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<any>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      console.log('🚀 Iniciando câmera...');
      
      // Stop existing stream
      stopCamera();
      
      // Request camera permission with mobile-optimized constraints
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Back camera
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      });
      
      setStream(mediaStream);
      
      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            console.log('✅ Vídeo iniciado com sucesso');
            setIsScanning(true);
            startScanner();
          }).catch(err => {
            console.error('❌ Erro ao reproduzir vídeo:', err);
            onError?.('Erro ao iniciar vídeo da câmera');
          });
        };
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao acessar câmera:', error);
      
      let errorMessage = 'Erro ao acessar câmera';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permissão de câmera negada. Permita o acesso à câmera nas configurações.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Câmera não encontrada no dispositivo.';
      }
      
      toast.error(errorMessage);
      onError?.(errorMessage);
    }
  };

  const stopCamera = () => {
    console.log('🛑 Parando câmera...');
    
    // Stop scanner
    if (scannerRef.current) {
      try {
        scannerRef.current.reset();
      } catch (e) {
        console.log('Scanner already stopped');
      }
      scannerRef.current = null;
    }
    
    // Stop video stream
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('📹 Track parada:', track.kind);
      });
      setStream(null);
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
    setTorchEnabled(false);
  };

  const startScanner = async () => {
    try {
      // Dynamic import para reduzir bundle size
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      
      scannerRef.current = new BrowserMultiFormatReader();
      
      scannerRef.current.decodeFromVideoDevice(
        undefined, // Use default camera
        videoRef.current,
        (result: any, error: any) => {
          if (result) {
            const code = result.getText();
            console.log('📱 Código escaneado:', code);
            
            // Vibração de feedback
            if ('vibrate' in navigator) {
              navigator.vibrate(200);
            }
            
            onScanResult?.(code);
            toast.success(`Código escaneado: ${code}`);
            
            // Optional: pause for a moment to show result
            setTimeout(() => {
              if (scannerRef.current) {
                scannerRef.current.reset();
                startScanner(); // Restart scanning
              }
            }, 1000);
          }
          
          // Ignore common scanning errors - they happen frequently
          if (error && !error.name?.includes('NotFound')) {
            console.warn('Scanner error:', error);
          }
        }
      );
      
    } catch (error: any) {
      console.error('❌ Erro ao inicializar scanner:', error);
      onError?.('Erro ao inicializar scanner de códigos');
    }
  };

  const toggleTorch = async () => {
    if (!stream) return;
    
    try {
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities() as any;
      
      if (capabilities.torch) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !torchEnabled } as any]
        });
        setTorchEnabled(!torchEnabled);
        toast.success(torchEnabled ? 'Flash desligado' : 'Flash ligado');
      } else {
        toast.warning('Flash não disponível neste dispositivo');
      }
    } catch (error) {
      console.error('❌ Erro ao controlar flash:', error);
      toast.error('Erro ao controlar flash');
    }
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScanResult?.(manualCode.trim());
      setManualCode('');
      setShowManualInput(false);
      toast.success(`Código inserido: ${manualCode.trim()}`);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Scanner Card */}
      <Card className="p-4">
        {/* Video Container */}
        <div className="relative aspect-square bg-black rounded-lg overflow-hidden mb-4">
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
                {/* Scan Frame */}
                <div className="absolute inset-6 border-2 border-white/50 rounded-lg">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br" />
                </div>
                
                {/* Scan Line */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3/4 h-0.5 bg-white animate-pulse shadow-lg" />
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <Camera className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p className="text-sm opacity-75">Toque para iniciar</p>
              </div>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="space-y-3">
          {!isScanning ? (
            <Button 
              onClick={startCamera} 
              size="lg" 
              className="w-full h-14 text-lg"
            >
              <Camera className="w-6 h-6 mr-2" />
              Iniciar Scanner
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={stopCamera} 
                variant="destructive" 
                size="lg" 
                className="flex-1 h-14"
              >
                <X className="w-5 h-5 mr-2" />
                Parar
              </Button>
              
              <Button 
                onClick={toggleTorch} 
                variant="outline" 
                size="lg"
                className="h-14 px-4"
              >
                <Flashlight className={`w-5 h-5 ${torchEnabled ? 'text-yellow-500' : ''}`} />
              </Button>
            </div>
          )}

          {/* Manual Input Toggle */}
          <Button 
            onClick={() => setShowManualInput(!showManualInput)} 
            variant="outline" 
            size="lg" 
            className="w-full h-12"
          >
            <Search className="w-5 h-5 mr-2" />
            Digitar Código
          </Button>
        </div>
      </Card>

      {/* Manual Input */}
      {showManualInput && (
        <Card className="p-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">Digite o código:</label>
            <div className="flex gap-2">
              <Input
                placeholder="Código de barras..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                className="flex-1 h-12 text-lg"
                autoFocus
              />
              <Button 
                onClick={handleManualSubmit} 
                disabled={!manualCode.trim()}
                size="lg"
                className="h-12 px-6"
              >
                OK
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>• Aponte a câmera para o código de barras</p>
        <p>• Mantenha o código dentro da área marcada</p>
        <p>• Aguarde o scanner reconhecer automaticamente</p>
      </div>
    </div>
  );
};