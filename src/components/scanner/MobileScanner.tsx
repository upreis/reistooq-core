import React, { useState, useRef, useEffect } from 'react';
import { Camera as CameraIcon, X, Flashlight, Keyboard, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Camera } from '@capacitor/camera';
import { CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface MobileScannerProps {
  onScanResult?: (code: string) => void;
  onError?: (error: string) => void;
}

export const MobileScanner: React.FC<MobileScannerProps> = ({
  onScanResult,
  onError
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isNative, setIsNative] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScanRef = useRef<string>('');
  const scanTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    setIsNative(Capacitor.isNativePlatform());
    
    return () => {
      console.log('🧹 Component unmounting - cleaning up resources');
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  const cleanup = () => {
    console.log('🧹 Cleaning up scanner resources...');
    
    // Clear timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = undefined;
    }
    
    // Stop scanner
    if (scannerRef.current) {
      try {
        scannerRef.current.reset();
      } catch (e) {
        console.log('Scanner já parado');
      }
      scannerRef.current = null;
    }
    
    // Stop and remove video
    if (videoRef.current) {
      // Remove event listeners
      videoRef.current.onloadedmetadata = null;
      videoRef.current.onerror = null;
      
      // Pause video
      try {
        videoRef.current.pause();
      } catch (e) {
        console.log('Video já pausado');
      }
      
      // Clear source
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
      videoRef.current.load(); // Reset video element
    }
    
    // Stop ALL media tracks (camera AND microphone)
    if (streamRef.current) {
      console.log('🛑 Stopping media tracks:', streamRef.current.getTracks().length);
      streamRef.current.getTracks().forEach(track => {
        console.log(`  Stopping ${track.kind} track:`, track.label);
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Reset states only if mounted
    if (isMountedRef.current) {
      setIsScanning(false);
      setTorchEnabled(false);
    }
    
    console.log('✅ Cleanup complete');
  };

  const startNativeCamera = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      if (image.webPath) {
        await decodeImageFromUri(image.webPath);
      }
    } catch (error: any) {
      console.error('❌ Erro câmera nativa:', error);
      if (error.message !== 'User cancelled photos app') {
        toast.error('Erro ao acessar câmera nativa');
        onError?.('Erro ao acessar câmera');
      }
    }
  };

  const decodeImageFromUri = async (uri: string) => {
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      const result = await reader.decodeFromImageUrl(uri);
      const code = result.getText();
      
      handleScanSuccess(code);
    } catch (err) {
      console.error('❌ Erro ao decodificar:', err);
      toast.error('Não foi possível ler o código');
      onError?.('Código não encontrado na imagem');
    }
  };

  const startWebCamera = async () => {
    try {
      console.log('🚀 Iniciando câmera web...');

      if (!window.isSecureContext && location.hostname !== 'localhost') {
        const msg = 'HTTPS necessário para acessar câmera';
        toast.error(msg);
        onError?.(msg);
        return;
      }

      // Limpar recursos anteriores ANTES de iniciar
      cleanup();
      
      if (!isMountedRef.current) {
        console.log('Component unmounted, aborting camera start');
        return;
      }
      
      setIsScanning(true);

      // Solicitar APENAS vídeo, SEM áudio
      console.log('📹 Solicitando acesso à câmera (SEM microfone)...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false // CRÍTICO: Garantir que não solicita microfone
      });

      // Verificar se apenas vídeo foi obtido
      const videoTracks = mediaStream.getVideoTracks();
      const audioTracks = mediaStream.getAudioTracks();
      
      console.log(`📊 Tracks obtidos: ${videoTracks.length} vídeo, ${audioTracks.length} áudio`);
      
      // Se obteve áudio por engano, parar e remover
      if (audioTracks.length > 0) {
        console.warn('⚠️ Áudio foi obtido por engano, removendo...');
        audioTracks.forEach(track => {
          track.stop();
          mediaStream.removeTrack(track);
        });
      }

      if (!isMountedRef.current) {
        console.log('Component unmounted during camera init, cleaning up');
        mediaStream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = mediaStream;

      if (videoRef.current) {
        // Configurar vídeo para iOS
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');
        videoRef.current.setAttribute('playsinline', 'true');
        
        videoRef.current.srcObject = mediaStream;
        
        videoRef.current.onloadedmetadata = async () => {
          if (!isMountedRef.current) {
            console.log('Component unmounted, skipping video play');
            cleanup();
            return;
          }
          
          try {
            await videoRef.current?.play();
            console.log('✅ Vídeo iniciado');
            
            // Iniciar decodificação após vídeo carregar
            if (isMountedRef.current) {
              setTimeout(() => {
                if (isMountedRef.current) {
                  startDecoding();
                }
              }, 300);
            }
          } catch (err) {
            console.error('❌ Erro ao reproduzir:', err);
            toast.error('Erro ao iniciar vídeo');
            cleanup();
          }
        };
        
        videoRef.current.onerror = (err) => {
          console.error('❌ Erro no vídeo:', err);
          cleanup();
        };
      }

    } catch (error: any) {
      console.error('❌ Erro ao acessar câmera:', error);
      
      let errorMessage = 'Erro ao acessar câmera';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permissão negada. Ative nas configurações.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Câmera não encontrada.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Câmera em uso por outro app.';
      }
      
      toast.error(errorMessage);
      onError?.(errorMessage);
      cleanup();
    }
  };

  const startDecoding = async () => {
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      scannerRef.current = new BrowserMultiFormatReader();

      scannerRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result: any, error: any) => {
          if (result) {
            const code = result.getText();
            
            // Evitar scans duplicados
            if (code !== lastScanRef.current) {
              lastScanRef.current = code;
              handleScanSuccess(code);
              
              // Reset após 2 segundos
              if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
              }
              scanTimeoutRef.current = setTimeout(() => {
                lastScanRef.current = '';
              }, 2000);
            }
          }
          
          if (error && !error.name?.includes('NotFound')) {
            console.warn('Scanner error:', error);
          }
        }
      );
      
      console.log('✅ Decodificação iniciada');
      
    } catch (error) {
      console.error('❌ Erro ao inicializar scanner:', error);
      toast.error('Erro ao inicializar scanner');
      onError?.('Erro ao inicializar scanner');
    }
  };

  const handleScanSuccess = (code: string) => {
    console.log('📱 Código escaneado:', code);
    
    // Feedback imediato
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 50, 100]);
    }
    
    toast.success(`Código: ${code}`);
    onScanResult?.(code);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) {
      toast.warning('Inicie a câmera primeiro');
      return;
    }
    
    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (!videoTrack) {
        toast.warning('Track de vídeo não encontrado');
        return;
      }
      
      const capabilities = videoTrack.getCapabilities() as any;
      
      if (capabilities.torch) {
        const newState = !torchEnabled;
        await videoTrack.applyConstraints({
          advanced: [{ torch: newState } as any]
        });
        setTorchEnabled(newState);
        
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        
        toast.success(newState ? '🔦 Flash ligado' : 'Flash desligado');
      } else {
        toast.warning('Flash não disponível');
      }
    } catch (error) {
      console.error('❌ Erro flash:', error);
      toast.error('Erro ao controlar flash');
    }
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      handleScanSuccess(manualCode.trim());
      setManualCode('');
      setShowManualInput(false);
    }
  };

  const handleStartCamera = () => {
    if (isNative) {
      startNativeCamera();
    } else {
      startWebCamera();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
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
              
              {/* Scan Frame Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-6 border-2 border-white/50 rounded-lg">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br" />
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3/4 h-0.5 bg-white animate-pulse shadow-lg" />
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <CameraIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p className="text-sm opacity-75">Toque para iniciar</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {!isScanning ? (
            <Button 
              onClick={handleStartCamera} 
              size="lg" 
              className="w-full h-14 text-lg"
            >
              <CameraIcon className="w-6 h-6 mr-2" />
              {isNative ? 'Abrir Câmera' : 'Iniciar Scanner'}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={cleanup} 
                variant="destructive" 
                size="lg" 
                className="flex-1 h-14"
              >
                <X className="w-5 h-5 mr-2" />
                Parar
              </Button>
              
              {!isNative && (
                <Button 
                  onClick={toggleTorch} 
                  variant="outline" 
                  size="lg"
                  className="h-14 px-4"
                >
                  <Flashlight className={`w-5 h-5 ${torchEnabled ? 'text-yellow-500' : ''}`} />
                </Button>
              )}
            </div>
          )}

          <Button 
            onClick={() => setShowManualInput(!showManualInput)} 
            variant="outline" 
            size="lg" 
            className="w-full h-12"
          >
            <Keyboard className="w-5 h-5 mr-2" />
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
        <p>• Aponte para o código de barras</p>
        <p>• Mantenha dentro da área marcada</p>
        <p>• O reconhecimento é automático</p>
      </div>
    </div>
  );
};
