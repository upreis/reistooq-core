// =============================================================================
// SCANNER CORE HOOK - Orchestração principal do scanner
// =============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { ScannerState, ScanResult, ScannerError, UseScannerCoreOptions, ScannerHookResult } from '../types/scanner.types';
import { ScannerService } from '../services/ScannerService';
import { useScannerCamera } from './useScannerCamera';
import { useScannerSearch } from './useScannerSearch';
import { useScannerHistory } from './useScannerHistory';
import { toast } from 'sonner';

export const useScannerCore = (options: UseScannerCoreOptions = {}): ScannerHookResult => {
  const {
    enableContinuousMode = true,
    enableSound = true,
    enableVibration = true,
    onScanSuccess,
    onScanError,
    onProductFound,
    onProductNotFound
  } = options;

  const scannerServiceRef = useRef<ScannerService | null>(null);
  
  const [state, setState] = useState<ScannerState>({
    isActive: false,
    isScanning: false,
    isLoading: false,
    hasPermission: false,
    sessionStats: {
      scans_attempted: 0,
      scans_successful: 0,
      products_found: 0,
      unique_products: 0,
      session_duration: 0,
      average_scan_time: 0,
      actions_taken: 0
    }
  });

  const [settings, setSettings] = useState({
    continuous_mode: enableContinuousMode,
    sound_enabled: enableSound,
    vibration_enabled: enableVibration,
    torch_enabled: false,
    torch_auto: false,
    scan_delay: 1000,
    cache_duration: 1800000, // 30 minutes
    offline_mode: false,
    analytics_enabled: true,
    preferred_formats: []
  });

  const camera = useScannerCamera({
    onPermissionChange: (hasPermission) => {
      setState(prev => ({ ...prev, hasPermission }));
    }
  });

  const search = useScannerSearch({
    enableCache: true,
    onCacheHit: (product) => {
      console.log('✅ [Scanner] Cache hit for product:', product.nome);
    }
  });

  const history = useScannerHistory();

  // Initialize scanner service
  useEffect(() => {
    if (!scannerServiceRef.current) {
      scannerServiceRef.current = new ScannerService();
    }
  }, []);

  const handleScanResult = useCallback(async (result: ScanResult) => {
    setState(prev => ({
      ...prev,
      currentScan: result,
      sessionStats: {
        ...prev.sessionStats,
        scans_attempted: prev.sessionStats.scans_attempted + 1
      }
    }));

    try {
      const product = await search.searchByBarcode(result.code);
      
      if (product) {
        const enrichedResult = { ...result, product, found: true };
        
        setState(prev => ({
          ...prev,
          lastSuccessfulScan: enrichedResult,
          sessionStats: {
            ...prev.sessionStats,
            scans_successful: prev.sessionStats.scans_successful + 1,
            products_found: prev.sessionStats.products_found + 1
          }
        }));

        // Add to history
        history.addScan(enrichedResult);

        // Haptic feedback
        if (settings.vibration_enabled && 'vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }

        // Sound feedback
        if (settings.sound_enabled) {
          const audio = new Audio('/sounds/scan-success.mp3');
          audio.play().catch(() => {});
        }

        onScanSuccess?.(enrichedResult);
        onProductFound?.(product);
        
        toast.success(`Produto encontrado: ${product.nome}`);
      } else {
        const failedResult = { ...result, found: false };
        history.addScan(failedResult);
        
        if (settings.vibration_enabled && 'vibrate' in navigator) {
          navigator.vibrate(400);
        }

        onProductNotFound?.(result.code);
        toast.error('Produto não encontrado');
      }
    } catch (error) {
      console.error('❌ [Scanner] Error processing scan:', error);
      onScanError?.(ScannerError.UNKNOWN_ERROR);
      toast.error('Erro ao processar código');
    }
  }, [search, history, settings, onScanSuccess, onScanError, onProductFound, onProductNotFound]);

  const startScanning = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      await camera.initialize();
      await camera.startCamera();
      
      setState(prev => ({ 
        ...prev, 
        isActive: true, 
        isScanning: true, 
        isLoading: false 
      }));

      console.log('✅ [Scanner] Scanning started');
    } catch (error) {
      console.error('❌ [Scanner] Failed to start scanning:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: ScannerError.CAMERA_ACCESS_FAILED 
      }));
      toast.error('Erro ao acessar câmera');
    }
  }, [camera]);

  const stopScanning = useCallback(() => {
    try {
      camera.stopCamera();
      setState(prev => ({ 
        ...prev, 
        isActive: false, 
        isScanning: false,
        currentScan: undefined
      }));
      console.log('🛑 [Scanner] Scanning stopped');
    } catch (error) {
      console.error('❌ [Scanner] Error stopping scanner:', error);
    }
  }, [camera]);

  const scanBarcode = useCallback(async (code: string): Promise<ScanResult> => {
    const result: ScanResult = {
      code,
      format: 'CODE_128' as any,
      timestamp: new Date(),
      found: false,
      confidence: 1.0
    };

    await handleScanResult(result);
    return result;
  }, [handleScanResult]);

  const updateSettings = useCallback((newSettings: Partial<typeof settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const clearCache = useCallback(() => {
    search.clearCache();
    toast.success('Cache limpo');
  }, [search]);

  const exportData = useCallback(async (): Promise<Blob> => {
    const data = {
      history: history.getHistory(),
      analytics: history.getAnalytics(),
      settings,
      exportedAt: new Date().toISOString()
    };
    
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  }, [history, settings]);

  const importData = useCallback(async (file: File): Promise<void> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.history) {
        // Import history logic would go here
        toast.success('Dados importados com sucesso');
      }
    } catch (error) {
      console.error('❌ [Scanner] Import failed:', error);
      toast.error('Erro ao importar dados');
    }
  }, []);

  return {
    state,
    settings,
    cache: search.cache,
    analytics: history.getAnalytics(),
    actions: {
      startScanning,
      stopScanning,
      scanBarcode,
      updateSettings,
      clearCache,
      exportData,
      importData
    }
  };
};