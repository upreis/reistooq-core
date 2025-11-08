import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

// Audio feedback utilities
const playSuccessBeep = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Som de sucesso: Dois bips ascendentes (positivo)
    const createBeep = (freq: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration);
      
      oscillator.start(audioContext.currentTime + startTime);
      oscillator.stop(audioContext.currentTime + startTime + duration);
    };
    
    // Duas notas ascendentes: Dó → Sol (sucesso!)
    createBeep(523, 0, 0.1);      // Dó (C5)
    createBeep(784, 0.12, 0.15);  // Sol (G5)
  } catch (error) {
    console.warn('Audio playback not supported:', error);
  }
};

const playPartialBeep = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Som de alerta: Bip único grave e curto (parcial)
    oscillator.frequency.value = 300;  // Frequência mais grave
    oscillator.type = 'triangle';      // Som mais suave
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch (error) {
    console.warn('Audio playback not supported:', error);
  }
};

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
    scanDelay = 200,  // ← Reduzido de 500ms para 200ms para scanner mais responsivo
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
    
    // Stop callback first
    isCallbackActiveRef.current = false;
    isScanningRef.current = false;
    
    // Stop scanner
    if (readerRef.current) {
      try {
        readerRef.current.reset();
        console.log('✅ [Scanner] ZXing decoder stopped');
      } catch (e) {
        console.log('[Scanner] Decoder already stopped');
      }
      readerRef.current = null;
    }

    // CRITICAL: Stop all media tracks with enhanced verification
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      console.log(`🛑 [Scanner] Found ${tracks.length} track(s) to stop`);
      
      tracks.forEach((track, index) => {
        console.log(`   Track ${index + 1}: ${track.kind} - ${track.label} - ReadyState: ${track.readyState}`);
        
        if (track.readyState !== 'ended') {
          try {
            track.stop();
            console.log(`   ✅ Stopped ${track.kind} track`);
          } catch (e) {
            console.error(`   ❌ Error stopping ${track.kind} track:`, e);
          }
        } else {
          console.log(`   ⚠️ Track already ended`);
        }
      });
      
      // Verify all tracks are stopped after a delay
      setTimeout(() => {
        tracks.forEach((track, index) => {
          console.log(`   Verification ${index + 1}: ${track.kind} - ReadyState: ${track.readyState}`);
          if (track.readyState !== 'ended') {
            console.error(`   ❌ WARNING: Track ${index + 1} still active!`);
            try {
              track.stop(); // Force stop again
            } catch (e) {
              console.error('Failed to force stop:', e);
            }
          }
        });
      }, 100);
      
      streamRef.current = null;
      console.log('✅ [Scanner] Stream reference cleared');
    } else {
      console.warn('⚠️ [Scanner] No stream to stop');
    }

    // Clear video element thoroughly
    if (videoRef.current) {
      const video = videoRef.current;
      
      // Remove all event listeners
      video.onloadedmetadata = null;
      video.onerror = null;
      video.onplay = null;
      video.onpause = null;
      
      try {
        video.pause();
        console.log('✅ [Scanner] Video paused');
      } catch (e) {
        console.log('[Scanner] Video already paused');
      }
      
      // CRITICAL: Clear srcObject FIRST to release camera
      if (video.srcObject) {
        video.srcObject = null;
        console.log('✅ [Scanner] srcObject cleared');
      }
      
      video.src = '';
      video.removeAttribute('src');
      
      try {
        video.load();
        console.log('✅ [Scanner] Video element reset');
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

    // Reset states
    if (isMountedRef.current) {
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

    console.log('✅ [Scanner] Cleanup complete - All resources released');
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
        // NO AUDIO - omitted intentionally
      });
      
      const tracks = stream.getTracks();
      console.log(`🔍 Permission check - found ${tracks.length} track(s)`);
      tracks.forEach(track => {
        console.log(`   Stopping ${track.kind} track from permission check`);
        if (track.kind === 'audio') {
          console.error('❌ Audio track in permission check - should not happen!');
        }
        track.stop();
      });
      
      setState(prev => ({ ...prev, hasPermission: true }));
      return true;
    } catch (error) {
      console.error('[Scanner] Permission denied:', error);
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
      const { DecodeHintType, BarcodeFormat } = await import('@zxing/library');
      
      // ✅ CONFIGURAÇÃO OTIMIZADA: Melhor detecção de códigos
      const hints = new Map();
      hints.set(DecodeHintType.TRY_HARDER, true);
      hints.set(DecodeHintType.ASSUME_GS1, false);
      hints.set(DecodeHintType.ASSUME_CODE_39_CHECK_DIGIT, true);
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, 
        BarcodeFormat.EAN_8, 
        BarcodeFormat.CODE_128, 
        BarcodeFormat.CODE_39,
        BarcodeFormat.UPC_A, 
        BarcodeFormat.UPC_E, 
        BarcodeFormat.ITF, 
        BarcodeFormat.CODE_93,
        BarcodeFormat.CODABAR,
        BarcodeFormat.QR_CODE
      ]);
      
      readerRef.current = new BrowserMultiFormatReader(hints);
      console.log('✅ [Scanner] ZXing reader configured with enhanced detection');

      // ✅ CONFIGURAÇÃO OTIMIZADA: Resolução melhorada para desktop
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { 
              deviceId: { exact: deviceId },
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 },
              facingMode: preferredCamera === 'back' ? 'environment' : 'user',
              frameRate: { ideal: 30 }
            }
          : { 
              facingMode: preferredCamera === 'back' ? 'environment' : 'user',
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 },
              frameRate: { ideal: 30 }
            }
        // ⚠️ CRITICAL: NO AUDIO - explicitly undefined to prevent any audio access
      };
      
      // Double-check: ensure no audio property exists
      if ('audio' in constraints) {
        delete (constraints as any).audio;
      }

      console.log('📷 [Scanner] Requesting camera access (VIDEO ONLY)...', JSON.stringify(constraints));
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // ✅ VERIFICATION: Log all tracks to confirm NO AUDIO
      const allTracks = stream.getTracks();
      console.log(`📊 [Scanner] Stream has ${allTracks.length} track(s):`);
      allTracks.forEach((track, index) => {
        console.log(`   Track ${index + 1}: ${track.kind} - ${track.label}`);
        if (track.kind === 'audio') {
          console.error('❌ CRITICAL: Audio track detected! This should NEVER happen!');
          track.stop(); // Stop it immediately
        }
      });

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
          if (!isCallbackActiveRef.current || !isScanningRef.current) {
            return;
          }

          try {
            if (result) {
              const code = result.getText().trim();
              const format = result.getBarcodeFormat();
              const now = Date.now();
              
              // ✅ VALIDAÇÃO: Detectar leitura parcial
              const isPartialRead = code.length < 7; // Maioria dos códigos tem 7+ dígitos
              
              if (isPartialRead) {
                console.warn(`⚠️ [Scanner] Leitura parcial detectada: "${code}" (${code.length} chars)`);
                
                // Feedback para leitura parcial
                if ('vibrate' in navigator) {
                  navigator.vibrate(50); // Vibração curta única
                }
                playPartialBeep();
                
                // Não processar, apenas alertar visualmente
                return;
              }
              
              console.log(`🎯 [Scanner] CÓDIGO COMPLETO! Code: "${code}" (${code.length} chars), Format: ${format}`);
              
              // Anti-duplicate com delay menor para desktop
              if (code === lastScanRef.current && now - lastScanTimeRef.current < scanDelay) {
                console.log('⏭️ [Scanner] Ignorando scan duplicado');
                return;
              }
              
              lastScanRef.current = code;
              lastScanTimeRef.current = now;
              
              // ✅ Feedback de SUCESSO - código completo
              if ('vibrate' in navigator) {
                navigator.vibrate([50, 50, 100]); // Padrão de vibração de sucesso
              }
              
              playSuccessBeep(); // Som de sucesso (dois bips ascendentes)
              
              console.log('✅ [Scanner] Processando código válido completo:', code);
              
              if (scanSafetyTimeoutRef.current) {
                clearTimeout(scanSafetyTimeoutRef.current);
                scanSafetyTimeoutRef.current = undefined;
              }
              
              onScan(code);
            }
            
            if (error && !error.name?.includes('NotFound')) {
              // Log errors occasionally, not every frame
              if (Date.now() % 3000 < 100) {
                console.warn('[Scanner] Decode error:', error.message);
              }
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
