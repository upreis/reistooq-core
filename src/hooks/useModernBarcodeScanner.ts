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
  isScanning: boolean;
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
    isScanning: false,
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
  const scanSafetyTimeoutRef = useRef<NodeJS.Timeout>();
  const isCallbackActiveRef = useRef<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('🧹 [Scanner] Cleaning up...');
    
    // Stop scanner
    if (readerRef.current) {
      try {
        readerRef.current.reset();
        console.log('✅ [Scanner] ZXing stopped');
      } catch (e) {
        console.log('[Scanner] Already stopped');
      }
      readerRef.current = null;
    }

    // Stop all media tracks
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      console.log(`🛑 [Scanner] Stopping ${tracks.length} tracks`);
      
      tracks.forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error('[Scanner] Error stopping track:', e);
        }
      });
      
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = null;
      videoRef.current.onerror = null;
      
      try {
        videoRef.current.pause();
      } catch (e) {
        console.log('[Scanner] Video already paused');
      }
      
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
      
      try {
        videoRef.current.load();
      } catch (e) {
        console.log('[Scanner] Error resetting video:', e);
      }
    }

    // Clear timeouts
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = undefined;
    }
    
    if (scanSafetyTimeoutRef.current) {
      clearTimeout(scanSafetyTimeoutRef.current);
      scanSafetyTimeoutRef.current = undefined;
    }
    
    isCallbackActiveRef.current = false;

    // Reset states
    if (isMountedRef.current) {
      isScanningRef.current = false;
      
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

    console.log('✅ [Scanner] Cleanup complete');
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
      console.error('[Scanner] Failed to load devices:', error);
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
    if (isInitializingRef.current) {
      console.warn('⚠️ [Scanner] Already initializing');
      return false;
    }

    isInitializingRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    isScanningRef.current = false;
    
    try {
      cleanup();

      // Check secure context
      if (!window.isSecureContext && location.hostname !== 'localhost') {
        throw new Error('HTTPS required for camera access');
      }

      console.log('📷 [Scanner] Loading ZXing...');
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      readerRef.current = new BrowserMultiFormatReader();

      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } }
          : { facingMode: preferredCamera === 'back' ? 'environment' : 'user' }
      };

      console.log('📷 [Scanner] Requesting camera access...', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        const video = videoRef.current;
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true');
        video.setAttribute('playsinline', 'true');
        video.muted = true;
        (video as any).playsInline = true;

        await video.play();
        console.log('✅ [Scanner] Video playing');
      }

      // Check torch support
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities() as any;
      const torchSupported = 'torch' in capabilities;

      setState(prev => ({
        ...prev,
        isActive: true,
        isScanning: false,
        isLoading: false,
        currentDevice: deviceId || prev.currentDevice,
        torchSupported,
        hasPermission: true
      }));

      console.log('✅ [Scanner] Camera started successfully');
      isInitializingRef.current = false;
      return true;

    } catch (error: any) {
      console.error('❌ [Scanner] Failed to start camera:', error);
      
      let errorMessage = 'Falha ao acessar câmera';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permissão de câmera negada';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Nenhuma câmera encontrada';
      } else if (error.message.includes('HTTPS')) {
        errorMessage = 'HTTPS necessário para acesso à câmera';
      }

      setState(prev => ({
        ...prev,
        isScanning: false,
        isLoading: false,
        error: errorMessage,
        hasPermission: false
      }));

      isInitializingRef.current = false;
      toast.error(errorMessage);
      return false;
    }
  }, [cleanup, preferredCamera]);

  // Start scanning
  const startScanning = useCallback((onScan: (code: string) => void) => {
    if (!readerRef.current || !videoRef.current) {
      console.error('❌ [Scanner] Not initialized');
      toast.error('Câmera não está ativa');
      return;
    }

    if (isScanningRef.current) {
      console.warn('⚠️ [Scanner] Already scanning');
      return;
    }

    console.log('🔍 [Scanner] Starting barcode scanning...');

    try {
      isScanningRef.current = true;
      setState(prev => ({ ...prev, isScanning: true }));

      scanSafetyTimeoutRef.current = setTimeout(() => {
        if (isScanningRef.current) {
          console.warn('⚠️ [Scanner] Safety timeout - resetting');
          isScanningRef.current = false;
          setState(prev => ({ ...prev, isScanning: false }));
          toast.warning('Scanner reiniciado por segurança');
        }
      }, 60000);

      isCallbackActiveRef.current = true;

      readerRef.current.decodeFromVideoDevice(
        state.currentDevice,
        videoRef.current,
        (result: any, error: any) => {
          if (!isCallbackActiveRef.current) {
            return;
          }

          try {
            if (result) {
              const code = result.getText();
              const now = Date.now();
              
              if (code === lastScanRef.current && now - lastScanTimeRef.current < scanDelay) {
                return;
              }
              
              lastScanRef.current = code;
              lastScanTimeRef.current = now;
              
              if ('vibrate' in navigator) {
                navigator.vibrate([50, 50, 100]);
              }
              
              console.log('📱 [Scanner] Code scanned:', code);
              
              if (scanSafetyTimeoutRef.current) {
                clearTimeout(scanSafetyTimeoutRef.current);
                scanSafetyTimeoutRef.current = undefined;
              }
              
              onScan(code);
            }
            
            if (error && !error.name?.includes('NotFound')) {
              console.warn('[Scanner] Scan error:', error);
            }
          } catch (callbackError) {
            console.error('❌ [Scanner] Callback error:', callbackError);
            isScanningRef.current = false;
            setState(prev => ({ ...prev, isScanning: false }));
            
            if (scanSafetyTimeoutRef.current) {
              clearTimeout(scanSafetyTimeoutRef.current);
              scanSafetyTimeoutRef.current = undefined;
            }
            
            toast.error('Erro ao processar código');
          }
        }
      );

      console.log('✅ [Scanner] Scanning started');
    } catch (error) {
      console.error('❌ [Scanner] Failed to start scanning:', error);
      isScanningRef.current = false;
      setState(prev => ({ ...prev, isScanning: false }));
      isCallbackActiveRef.current = false;
      
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
      toast.warning('Lanterna não suportada');
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
      
      toast.success(newTorchState ? '🔦 Lanterna ligada' : '💡 Lanterna desligada');
    } catch (error) {
      console.error('[Scanner] Failed to toggle torch:', error);
      toast.error('Falha ao controlar lanterna');
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

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      await loadDevices();
      await checkPermissions();
      
      if (autoStart) {
        await startCamera();
      }
    };
    
    init();
  }, [autoStart, loadDevices, checkPermissions, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      console.log('🧹 [Scanner] Unmounting...');
      isMountedRef.current = false;
      isScanningRef.current = false;
      
      if (scanSafetyTimeoutRef.current) {
        clearTimeout(scanSafetyTimeoutRef.current);
        scanSafetyTimeoutRef.current = undefined;
      }
      
      if (readerRef.current) {
        try {
          readerRef.current.reset();
        } catch (e) {
          console.log('[Scanner] Already stopped');
        }
        readerRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.error('[Scanner] Error stopping track:', e);
          }
        });
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

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
