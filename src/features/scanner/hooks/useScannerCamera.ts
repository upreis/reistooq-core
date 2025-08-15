// =============================================================================
// SCANNER CAMERA HOOK - Gestão de câmera e dispositivos
// =============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { CameraDevice, ScannerError, UseScannerCameraOptions } from '../types/scanner.types';
import { BarcodeDecoder } from '../services/BarcodeDecoder';

export const useScannerCamera = (options: UseScannerCameraOptions = {}) => {
  const {
    preferredDeviceId,
    constraints = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'environment'
    },
    enableTorch = false,
    onPermissionChange,
    onDeviceChange
  } = options;

  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<string | undefined>(preferredDeviceId);
  const [availableDevices, setAvailableDevices] = useState<CameraDevice[]>([]);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [error, setError] = useState<ScannerError | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const decoderRef = useRef<BarcodeDecoder | null>(null);

  // Initialize decoder
  useEffect(() => {
    if (!decoderRef.current) {
      decoderRef.current = new BarcodeDecoder();
    }
    
    return () => {
      decoderRef.current?.dispose();
    };
  }, []);

  // Check camera permission
  const checkPermission = useCallback(async (): Promise<boolean> => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const granted = result.state === 'granted';
      setHasPermission(granted);
      onPermissionChange?.(granted);
      return granted;
    } catch (error) {
      console.warn('⚠️ [Camera] Permission check failed:', error);
      // Try to request permission by attempting to access camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
        onPermissionChange?.(true);
        return true;
      } catch {
        setHasPermission(false);
        onPermissionChange?.(false);
        return false;
      }
    }
  }, [onPermissionChange]);

  // Get available camera devices
  const getDevices = useCallback(async (): Promise<CameraDevice[]> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          kind: device.kind,
          groupId: device.groupId
        }));

      setAvailableDevices(videoDevices);
      onDeviceChange?.(videoDevices);
      
      // Set default device if none selected
      if (!currentDevice && videoDevices.length > 0) {
        // Prefer back camera if available
        const backCamera = videoDevices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('environment')
        );
        setCurrentDevice(backCamera?.deviceId || videoDevices[0].deviceId);
      }

      return videoDevices;
    } catch (error) {
      console.error('❌ [Camera] Failed to get devices:', error);
      setError(ScannerError.CAMERA_NOT_FOUND);
      return [];
    }
  }, [currentDevice, onDeviceChange]);

  // Initialize camera system
  const initialize = useCallback(async (): Promise<void> => {
    const hasPermission = await checkPermission();
    if (!hasPermission) {
      throw new Error(ScannerError.CAMERA_PERMISSION_DENIED);
    }

    await getDevices();
    
    if (decoderRef.current) {
      await decoderRef.current.initialize();
    }
  }, [checkPermission, getDevices]);

  // Start camera stream
  const startCamera = useCallback(async (deviceId?: string): Promise<void> => {
    try {
      setError(null);
      
      const targetDeviceId = deviceId || currentDevice;
      const mediaConstraints: MediaStreamConstraints = {
        video: targetDeviceId 
          ? { deviceId: { exact: targetDeviceId }, ...constraints }
          : constraints,
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      streamRef.current = stream;
      setIsActive(true);
      setCurrentDevice(targetDeviceId);

      console.log('✅ [Camera] Started successfully');
    } catch (error) {
      console.error('❌ [Camera] Failed to start:', error);
      setError(ScannerError.CAMERA_ACCESS_FAILED);
      setIsActive(false);
      throw error;
    }
  }, [currentDevice, constraints]);

  // Stop camera stream
  const stopCamera = useCallback((): void => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      if (decoderRef.current) {
        decoderRef.current.stopDecoding();
      }

      setIsActive(false);
      setTorchEnabled(false);
      console.log('🛑 [Camera] Stopped');
    } catch (error) {
      console.error('❌ [Camera] Error stopping:', error);
    }
  }, []);

  // Switch camera device
  const switchDevice = useCallback(async (deviceId: string): Promise<void> => {
    if (isActive) {
      stopCamera();
    }
    await startCamera(deviceId);
  }, [isActive, stopCamera, startCamera]);

  // Toggle torch/flash
  const toggleTorch = useCallback(async (): Promise<void> => {
    try {
      if (streamRef.current && decoderRef.current) {
        const newTorchState = !torchEnabled;
        await decoderRef.current.toggleTorch(newTorchState);
        setTorchEnabled(newTorchState);
      }
    } catch (error) {
      console.warn('⚠️ [Camera] Torch control failed:', error);
    }
  }, [torchEnabled]);

  // Start continuous scanning
  const startScanning = useCallback((
    onResult: (result: any) => void,
    onError: (error: ScannerError) => void
  ): void => {
    if (videoRef.current && decoderRef.current) {
      decoderRef.current.startContinuousDecoding(
        videoRef.current,
        onResult,
        onError,
        currentDevice
      );
    }
  }, [currentDevice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    // State
    hasPermission,
    isActive,
    currentDevice,
    availableDevices,
    torchEnabled,
    error,
    
    // Refs
    videoRef,
    
    // Actions
    initialize,
    startCamera,
    stopCamera,
    switchDevice,
    toggleTorch,
    startScanning,
    checkPermission,
    getDevices
  };
};