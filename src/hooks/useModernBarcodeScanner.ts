import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface ScannerConfig {
  preferredCamera?: 'front' | 'back';
  scanDelay?: number;
  autoStart?: boolean;
  formats?: string[];
}

interface ScannerState {
  isActive: boolean;
  isScanning: boolean; // ✅ NOVO: Estado de scanning separado
  isLoading: boolean;
  hasPermission: boolean | null;
  error: string | null;
  devices: MediaDeviceInfo[];
  currentDevice: string | null;
  torchEnabled: boolean;
  torchSupported: boolean;
}

export function useModernBarcodeScanner(config: ScannerConfig = {}) {
  const {
    preferredCamera = 'back',
    scanDelay = 500,
    autoStart = false,
  } = config;

  const [state, setState] = useState<ScannerState>({
    isActive: false,
    isScanning: false, // ✅ NOVO: Inicializa isScanning
    isLoading: false,
    hasPermission: null,
    error: null,
    devices: [],
    currentDevice: null,
    torchEnabled: false,
    torchSupported: false
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<any>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout>();
  const lastScanRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const isScanningRef = useRef<boolean>(false);
  const scanSafetyTimeoutRef = useRef<NodeJS.Timeout>(); // ✅ NOVO: Timeout de segurança

  // Cleanup function - ORDEM CRÍTICA!
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up scanner...');
    
    // 1. PRIMEIRO: Parar scanner ZXing
    if (readerRef.current) {
      try {
        readerRef.current.reset();
        console.log('✅ Scanner ZXing stopped');
      } catch (e) {
        console.log('Scanner already stopped');
      }
      readerRef.current = null;
    }

    // 2. SEGUNDO: Parar TODOS os tracks de mídia
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      console.log(`🛑 Stopping ${tracks.length} media tracks`);
      
      tracks.forEach(track => {
        console.log(`  Stopping ${track.kind} track: ${track.label} (state: ${track.readyState})`);
        try {
          track.stop();
        } catch (e) {
          console.error('Error stopping track:', e);
        }
      });
      
      streamRef.current = null;
      console.log('✅ All tracks stopped and stream cleared');
    }

    // 3. TERCEIRO: Limpar o elemento de vídeo
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = null;
      videoRef.current.onerror = null;
      
      try {
        videoRef.current.pause();
      } catch (e) {
        console.log('Video already paused');
      }
      
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
      
      try {
        videoRef.current.load();
      } catch (e) {
        console.log('Error resetting video element:', e);
      }
      
      console.log('✅ Video element cleaned');
    }

    // 4. QUARTO: Limpar timeouts
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = undefined;
    }
    
    if (scanSafetyTimeoutRef.current) {
      clearTimeout(scanSafetyTimeoutRef.current);
      scanSafetyTimeoutRef.current = undefined;
    }

    // 5. QUINTO: Reset states apenas se montado
    if (isMountedRef.current) {
      // ✅ Resetar ref síncrona PRIMEIRO
      isScanningRef.current = false;
      
      // ✅ Limpar timeout de segurança
      if (scanSafetyTimeoutRef.current) {
        clearTimeout(scanSafetyTimeoutRef.current);
        scanSafetyTimeoutRef.current = undefined;
      }
      
      setState(prev => ({
        ...prev,
        isActive: false,
        isScanning: false,
        isLoading: false,
        currentDevice: null,
        torchEnabled: false,
        torchSupported: false
      }));
    }

    console.log('✅ Cleanup complete - all resources released');
  }, []);

  // Load devices
  const loadDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      setState(prev => ({ ...prev, devices: videoDevices }));
      
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      const frontCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('front') || 
        device.label.toLowerCase().includes('user')
      );
      
      const selectedDevice = preferredCamera === 'back' 
        ? (backCamera || videoDevices[0])
        : (frontCamera || videoDevices[0]);
      
      if (selectedDevice) {
        setState(prev => ({ ...prev, currentDevice: selectedDevice.deviceId }));
      }
      
      return videoDevices;
    } catch (error) {
      console.error('Failed to load devices:', error);
      return [];
    }
  }, [preferredCamera]);

  // Check permissions
  const checkPermissions = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: preferredCamera === 'back' ? 'environment' : 'user' } 
      });
      stream.getTracks().forEach(track => track.stop());
      setState(prev => ({ ...prev, hasPermission: true }));
      return true;
    } catch (error) {
      setState(prev => ({ ...prev, hasPermission: false }));
      return false;
    }
  }, [preferredCamera]);

  // Start camera
  const startCamera = useCallback(async (deviceId?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    // ✅ CORREÇÃO BUG 2: Resetar isScanning quando iniciar câmera
    // Isso garante estado limpo ao reiniciar
    isScanningRef.current = false;
    
    try {
      // Stop any existing stream first
      cleanup();

      // Check secure context
      if (!window.isSecureContext && location.hostname !== 'localhost') {
        throw new Error('HTTPS required for camera access');
      }

      // Load ZXing
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      readerRef.current = new BrowserMultiFormatReader();

      // Get video constraints
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } }
          : { facingMode: preferredCamera === 'back' ? 'environment' : 'user' }
      };

      // Start video stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Configure video element for mobile
        const video = videoRef.current;
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true');
        video.setAttribute('playsinline', 'true');
        video.muted = true;
        (video as any).playsInline = true;

        await video.play();
      }

      // Check torch support
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities() as any;
      const torchSupported = 'torch' in capabilities;

      setState(prev => ({
        ...prev,
        isActive: true,
        isScanning: false, // ✅ CORREÇÃO BUG 2: Resetar isScanning quando câmera inicia
        isLoading: false,
        currentDevice: deviceId || prev.currentDevice,
        torchSupported,
        hasPermission: true
      }));

      console.log('✅ Camera started successfully');
      return true;

    } catch (error: any) {
      console.error('❌ Failed to start camera:', error);
      
      let errorMessage = 'Failed to access camera';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found';
      } else if (error.message.includes('HTTPS')) {
        errorMessage = 'HTTPS required for camera access';
      }

      // ✅ CORREÇÃO BUG 2: Garantir que isScanning também está false em caso de erro
      setState(prev => ({
        ...prev,
        isScanning: false, // ✅ Estado limpo mesmo com erro
        isLoading: false,
        error: errorMessage,
        hasPermission: false
      }));

      toast.error(errorMessage);
      return false;
    }
  }, [cleanup, preferredCamera]);

  // Start scanning
  const startScanning = useCallback((onScan: (code: string) => void) => {
    if (!readerRef.current || !videoRef.current) {
      console.error('❌ Scanner not initialized - cannot start scanning');
      toast.error('Câmera não está ativa');
      return;
    }

    // ✅ CORREÇÃO BUG 1: Verificar ref SÍNCRONA antes de state assíncrono
    if (isScanningRef.current) {
      console.warn('⚠️ Scanner already scanning (prevented race condition)');
      return;
    }

    console.log('🔍 Starting barcode scanning...');

    try {
      // ✅ Setar ref IMEDIATAMENTE (síncrono) - protege contra duplo clique
      isScanningRef.current = true;
      
      // ✅ Depois atualizar state (assíncrono) - para UI
      setState(prev => ({ ...prev, isScanning: true }));

      // ✅ CORREÇÃO B: Timeout de segurança - resetar após 60s sem atividade
      scanSafetyTimeoutRef.current = setTimeout(() => {
        if (isScanningRef.current) {
          console.warn('⚠️ Scanner safety timeout reached - resetting');
          isScanningRef.current = false;
          setState(prev => ({ ...prev, isScanning: false }));
          toast.warning('Scanner reiniciado por segurança');
        }
      }, 60000); // 60 segundos

      readerRef.current.decodeFromVideoDevice(
        state.currentDevice,
        videoRef.current,
        (result: any, error: any) => {
          // ✅ CORREÇÃO A: Try/catch dentro do callback para proteger contra erros
          try {
            if (result) {
              const code = result.getText();
              const now = Date.now();
              
              // Prevent duplicate scans
              if (code === lastScanRef.current && now - lastScanTimeRef.current < scanDelay) {
                return;
              }
              
              lastScanRef.current = code;
              lastScanTimeRef.current = now;
              
              // Immediate feedback
              if ('vibrate' in navigator) {
                navigator.vibrate([50, 50, 100]);
              }
              
              console.log('📱 Code scanned:', code);
              
              // ✅ Resetar timeout de segurança quando há scan bem-sucedido
              if (scanSafetyTimeoutRef.current) {
                clearTimeout(scanSafetyTimeoutRef.current);
                scanSafetyTimeoutRef.current = undefined;
              }
              
              onScan(code);
            }
            
            // Ignore common scanning errors
            if (error && !error.name?.includes('NotFound')) {
              console.warn('Scanner error:', error);
            }
          } catch (callbackError) {
            // ✅ CORREÇÃO A: Capturar erros dentro do callback ZXing
            console.error('❌ Error in scan callback:', callbackError);
            isScanningRef.current = false;
            setState(prev => ({ ...prev, isScanning: false }));
            
            // Limpar timeout de segurança
            if (scanSafetyTimeoutRef.current) {
              clearTimeout(scanSafetyTimeoutRef.current);
              scanSafetyTimeoutRef.current = undefined;
            }
            
            toast.error('Erro ao processar código escaneado');
          }
        }
      );

      console.log('✅ Barcode scanning started successfully');
    } catch (error) {
      console.error('❌ Failed to start scanning:', error);
      // ✅ Resetar AMBOS ref e state em caso de erro
      isScanningRef.current = false;
      setState(prev => ({ ...prev, isScanning: false }));
      
      // Limpar timeout de segurança
      if (scanSafetyTimeoutRef.current) {
        clearTimeout(scanSafetyTimeoutRef.current);
        scanSafetyTimeoutRef.current = undefined;
      }
      
      toast.error('Falha ao iniciar escaneamento');
    }
  }, [state.currentDevice, scanDelay]);

  // Toggle torch
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current || !state.torchSupported) {
      toast.warning('Torch not supported');
      return;
    }

    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      const newTorchState = !state.torchEnabled;
      
      await videoTrack.applyConstraints({
        advanced: [{ torch: newTorchState } as any]
      });
      
      setState(prev => ({ ...prev, torchEnabled: newTorchState }));
      
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      toast.success(newTorchState ? '🔦 Torch on' : '💡 Torch off');
    } catch (error) {
      console.error('Failed to toggle torch:', error);
      toast.error('Failed to control torch');
    }
  }, [state.torchEnabled, state.torchSupported]);

  // Switch camera
  const switchCamera = useCallback(async (deviceId: string) => {
    if (state.isActive) {
      await startCamera(deviceId);
    } else {
      setState(prev => ({ ...prev, currentDevice: deviceId }));
    }
  }, [state.isActive, startCamera]);

  // Mount/Unmount effect - Cleanup inline para evitar dependências
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      console.log('🧹 Unmounting - Cleaning up scanner...');
      isMountedRef.current = false;
      
      // ✅ Resetar ref síncrona no unmount também
      isScanningRef.current = false;
      
      // ✅ Limpar timeout de segurança no unmount
      if (scanSafetyTimeoutRef.current) {
        clearTimeout(scanSafetyTimeoutRef.current);
        scanSafetyTimeoutRef.current = undefined;
      }
      
      // Cleanup inline - executa na desmontagem do componente
      // 1. Parar scanner ZXing
      if (readerRef.current) {
        try {
          readerRef.current.reset();
          console.log('✅ Scanner ZXing stopped');
        } catch (e) {
          console.log('Scanner already stopped');
        }
        readerRef.current = null;
      }

      // 2. Parar TODOS os tracks de mídia
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        console.log(`🛑 Stopping ${tracks.length} media tracks`);
        
        tracks.forEach(track => {
          console.log(`  Stopping ${track.kind} track: ${track.label}`);
          try {
            track.stop();
          } catch (e) {
            console.error('Error stopping track:', e);
          }
        });
        
        streamRef.current = null;
        console.log('✅ All tracks stopped and stream cleared');
      }

      // 3. Limpar o elemento de vídeo
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = null;
        videoRef.current.onerror = null;
        
        try {
          videoRef.current.pause();
        } catch (e) {
          console.log('Video already paused');
        }
        
        videoRef.current.srcObject = null;
        videoRef.current.src = '';
        
        try {
          videoRef.current.load();
        } catch (e) {
          console.log('Error resetting video element:', e);
        }
        
        console.log('✅ Video element cleaned');
      }

      // 4. Limpar timeouts
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = undefined;
      }

      console.log('✅ Unmount cleanup complete');
    };
  }, []); // Array vazio - só executa no mount/unmount

  // Initialization effect - Separado para evitar loop
  useEffect(() => {
    const init = async () => {
      console.log('🚀 Initializing scanner...');
      await loadDevices();
      await checkPermissions();
      
      if (autoStart) {
        console.log('📸 Auto-starting camera...');
        await startCamera();
      }
    };
    
    init();
  }, [autoStart]); // Só depende de autoStart

  return {
    ...state,
    videoRef,
    startCamera,
    stopCamera: cleanup,
    startScanning,
    toggleTorch,
    switchCamera,
    loadDevices,
    checkPermissions
  };
}
