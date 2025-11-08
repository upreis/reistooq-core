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

    // 5. QUINTO: Reset states apenas se montado
    if (isMountedRef.current) {
      setState(prev => ({
        ...prev,
        isActive: false,
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

      setState(prev => ({
        ...prev,
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
      console.error('Scanner not initialized');
      return;
    }

    try {
      readerRef.current.decodeFromVideoDevice(
        state.currentDevice,
        videoRef.current,
        (result: any, error: any) => {
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
            onScan(code);
          }
          
          // Ignore common scanning errors
          if (error && !error.name?.includes('NotFound')) {
            console.warn('Scanner error:', error);
          }
        }
      );
    } catch (error) {
      console.error('Failed to start scanning:', error);
      toast.error('Failed to start barcode scanning');
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

  // Initialize on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    const init = async () => {
      await loadDevices();
      await checkPermissions();
      
      if (autoStart) {
        await startCamera();
      }
    };
    
    init();
    
    return () => {
      isMountedRef.current = false;
      cleanup();
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
