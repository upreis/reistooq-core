// =============================================================================
// SCANNER CORE COMPONENT - Interface principal do scanner
// =============================================================================

import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Scan, Zap, RotateCcw, Settings } from 'lucide-react';
import { useScannerCamera } from '../hooks/useScannerCamera';
import { ScanResult, ScannerError } from '../types/scanner.types';

interface ScannerCoreProps {
  onScan: (result: ScanResult) => void;
  onError: (error: ScannerError) => void;
  isActive: boolean;
  onToggle: () => void;
  className?: string;
}

export const ScannerCore: React.FC<ScannerCoreProps> = ({
  onScan,
  onError,
  isActive,
  onToggle,
  className = ''
}) => {
  const {
    hasPermission,
    isActive: cameraActive,
    currentDevice,
    availableDevices,
    torchEnabled,
    error,
    videoRef,
    initialize,
    startCamera,
    stopCamera,
    switchDevice,
    toggleTorch,
    startScanning
  } = useScannerCamera();

  const [scanOverlay, setScanOverlay] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize camera on mount
  useEffect(() => {
    if (isActive && hasPermission) {
      handleStartScanning();
    }
  }, [isActive, hasPermission]);

  // Handle scanner result
  const handleScanResult = (result: any) => {
    const scanResult: ScanResult = {
      code: result.text || result.getText(),
      format: 'CODE_128' as any, // Would map from result format
      timestamp: new Date(),
      found: false,
      confidence: 1.0
    };

    // Visual feedback
    setScanOverlay({
      x: 50,
      y: 50,
      width: 200,
      height: 100
    });

    setTimeout(() => setScanOverlay(null), 1000);

    onScan(scanResult);
  };

  // Handle scanner error
  const handleScanError = (error: ScannerError) => {
    console.warn('⚠️ [Scanner Core] Scan error:', error);
    onError(error);
  };

  // Start scanning process
  const handleStartScanning = async () => {
    try {
      if (!hasPermission) {
        await initialize();
      }
      
      await startCamera();
      startScanning(handleScanResult, handleScanError);
    } catch (error) {
      console.error('❌ [Scanner Core] Failed to start:', error);
      onError(ScannerError.CAMERA_ACCESS_FAILED);
    }
  };

  // Stop scanning process
  const handleStopScanning = () => {
    stopCamera();
  };

  // Toggle scanning
  const handleToggle = async () => {
    if (cameraActive) {
      handleStopScanning();
    } else {
      await handleStartScanning();
    }
    onToggle();
  };

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Scanner de Códigos
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {isActive && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Ativo
              </Badge>
            )}
            
            {availableDevices.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextDevice = availableDevices.find(d => d.deviceId !== currentDevice);
                  if (nextDevice) switchDevice(nextDevice.deviceId);
                }}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Video Container */}
        <div className="relative aspect-video bg-muted/20 rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/50">
          {cameraActive ? (
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
                {/* Scan Area Indicator */}
                <div className="absolute inset-4 border-2 border-primary/50 rounded-lg">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                </div>

                {/* Success Overlay */}
                {scanOverlay && (
                  <div 
                    className="absolute bg-green-500/30 border-2 border-green-500 rounded animate-pulse"
                    style={{
                      left: `${scanOverlay.x}px`,
                      top: `${scanOverlay.y}px`,
                      width: `${scanOverlay.width}px`,
                      height: `${scanOverlay.height}px`
                    }}
                  />
                )}

                {/* Center Guide */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-1 bg-primary/50 animate-pulse" />
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  {error ? 'Erro na Câmera' : 'Camera do Scanner'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {error 
                    ? 'Verifique as permissões da câmera'
                    : 'Clique em "Iniciar" para começar'
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button 
            onClick={handleToggle}
            className="flex-1"
            disabled={!hasPermission && !cameraActive}
          >
            <Camera className="w-4 h-4 mr-2" />
            {cameraActive ? 'Parar Scanner' : 'Iniciar Scanner'}
          </Button>

          {cameraActive && (
            <Button
              variant="outline"
              onClick={toggleTorch}
              disabled={!cameraActive}
            >
              <Zap className={`w-4 h-4 ${torchEnabled ? 'text-yellow-500' : ''}`} />
            </Button>
          )}
        </div>

        {/* Device Info */}
        {availableDevices.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Dispositivo: {availableDevices.find(d => d.deviceId === currentDevice)?.label || 'Padrão'}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              {error === ScannerError.CAMERA_PERMISSION_DENIED && 'Permissão da câmera negada'}
              {error === ScannerError.CAMERA_NOT_FOUND && 'Câmera não encontrada'}
              {error === ScannerError.CAMERA_ACCESS_FAILED && 'Falha ao acessar câmera'}
              {error === ScannerError.SCAN_TIMEOUT && 'Tempo limite de escaneamento'}
            </p>
          </div>
        )}
      </CardContent>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </Card>
  );
};

export default ScannerCore;