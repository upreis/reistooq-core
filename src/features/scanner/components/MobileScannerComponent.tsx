// =============================================================================
// MOBILE SCANNER COMPONENT - Interface mobile-first para scanner
// =============================================================================

import { useEffect, useState } from 'react';
import { useMobileBarcodeScanner } from '../hooks/useMobileBarcodeScanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CameraOff, Flashlight, FlashlightOff, RotateCcw, Settings2 } from 'lucide-react';

interface MobileScannerProps {
  onScanResult?: (code: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function MobileScannerComponent({ 
  onScanResult, 
  onError, 
  className 
}: MobileScannerProps) {
  const {
    isScanning,
    hasPermission,
    cameras,
    selectedCameraId,
    torchEnabled,
    capabilities,
    loading,
    error,
    isMobile,
    isIOS,
    isAndroid,
    videoRef,
    getMobileEnvironmentInfo,
    checkPermission,
    startCamera,
    stopCamera,
    toggleTorch,
    switchCamera,
    startScanning,
    stopScanning,
    setOnScanResult,
    isSupported
  } = useMobileBarcodeScanner();

  const [userGestureRequired, setUserGestureRequired] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Configurar callback de resultado
  useEffect(() => {
    setOnScanResult(() => onScanResult);
  }, [onScanResult, setOnScanResult]);

  // Propagar erros
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Verificar ambiente mobile na inicialização
  useEffect(() => {
    if (isMobile) {
      getMobileEnvironmentInfo();
    }
  }, [isMobile, getMobileEnvironmentInfo]);

  // Handler para iniciar câmera com gesto do usuário
  const handleStartWithGesture = async () => {
    setUserGestureRequired(false);
    
    const hasPerms = await checkPermission();
    if (hasPerms) {
      const cameraStarted = await startCamera();
      if (cameraStarted) {
        startScanning();
      }
    }
  };

  // Handler para parar tudo
  const handleStop = async () => {
    stopScanning();
    await stopCamera();
  };

  // Handler para alternar lanterna
  const handleTorchToggle = async () => {
    const success = await toggleTorch();
    if (!success && capabilities?.torch === false) {
      onError?.('Lanterna não suportada neste dispositivo');
    }
  };

  // Renderizar diagnósticos
  const renderDiagnostics = () => (
    <Card className="mt-4">
      <CardHeader>
        🔧 Diagnósticos Mobile
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm">
          <strong>Dispositivo:</strong> {isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop'}
        </div>
        <div className="text-sm">
          <strong>User Agent:</strong> 
          <code className="ml-2 p-1 bg-muted rounded text-xs">
            {navigator.userAgent}
          </code>
        </div>
        <div className="text-sm">
          <strong>HTTPS:</strong> {location.protocol === 'https:' ? '✅' : '❌'}
        </div>
        <div className="text-sm">
          <strong>PWA:</strong> {window.matchMedia('(display-mode: standalone)').matches ? '✅' : '❌'}
        </div>
        <div className="text-sm">
          <strong>Câmeras:</strong> {cameras.length}
        </div>
        <div className="text-sm">
          <strong>Torch Support:</strong> {capabilities?.torch ? '✅' : '❌'}
        </div>
        <div className="text-sm">
          <strong>Viewport:</strong> {window.innerWidth}x{window.innerHeight} 
          (DPR: {window.devicePixelRatio})
        </div>
      </CardContent>
    </Card>
  );

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <CameraOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            Scanner não suportado
          </h3>
          <p className="text-muted-foreground mb-4">
            Este navegador não suporta acesso à câmera. 
            Use Chrome, Safari ou Firefox atualizados.
          </p>
          <Button variant="outline" onClick={() => setShowDiagnostics(!showDiagnostics)}>
            Ver Diagnósticos
          </Button>
          {showDiagnostics && renderDiagnostics()}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Scanner Mobile
              {isMobile && (
                <Badge variant="secondary">
                  {isIOS ? 'iOS' : isAndroid ? 'Android' : 'Mobile'}
                </Badge>
              )}
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Diagnostics Toggle */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
            
            {/* Camera Selector */}
            {cameras.length > 1 && (
              <div className="flex items-center gap-2">
                <Select
                  value={selectedCameraId}
                  onValueChange={switchCamera}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cameras.map((camera) => (
                      <SelectItem key={camera.deviceId} value={camera.deviceId}>
                        {camera.isBack ? '📷 Traseira' : '🤳 Frontal'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <Card>
        {/* Área do vídeo */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
            controls={false}
          />
          
          {/* Overlay de escaneamento */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Máscara escura */}
              <div className="absolute inset-0 bg-black bg-opacity-50" />
              
              {/* Área de scan */}
              <div className="relative w-64 h-48 border-2 border-white rounded-lg">
                <div className="absolute inset-0 border border-white/20 rounded-lg">
                  {/* Cantos do scanner */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-primary rounded-tl" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-primary rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-primary rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-primary rounded-br" />
                  {/* Linha de scan animada */}
                  <div className="absolute w-full h-0.5 bg-primary animate-pulse" style={{
                    animation: 'scan-line 2s ease-in-out infinite'
                  }} />
                </div>
              </div>
              
              {/* Status */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  📡 Escaneando...
                </Badge>
              </div>
            </div>
          )}
          
          {/* Estado não escaneando */}
          {!isScanning && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
              <div className="text-center space-y-4">
                <Camera className="h-12 w-12 mx-auto" />
                <p className="text-lg font-medium">
                  {hasPermission === false 
                    ? "Permissão de câmera necessária"
                    : userGestureRequired 
                    ? "Toque para iniciar"
                    : "Pronto para escanear"
                  }
                </p>
                
                {/* Botão para iOS que requer gesto do usuário */}
                {(hasPermission !== false && !isScanning) && (
                  <Button onClick={handleStartWithGesture} disabled={loading}>
                    <Camera className="h-4 w-4 mr-2" />
                    {loading ? 'Iniciando...' : 'Iniciar Scanner'}
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-center">
                <RotateCcw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                Carregando câmera...
              </div>
            </div>
          )}
        </div>

        {/* Controles */}
        <CardContent className="p-4 flex justify-center gap-4">
          {!isScanning ? (
            <Button onClick={handleStartWithGesture} disabled={loading}>
              <Camera className="h-4 w-4 mr-2" />
              {loading ? 'Carregando...' : 'Iniciar'}
            </Button>
          ) : (
            <Button variant="outline" onClick={handleStop}>
              <CameraOff className="h-4 w-4 mr-2" />
              Parar
            </Button>
          )}
          
          {/* Torch (apenas se suportado) */}
          {capabilities?.torch && (
            <Button 
              variant="outline" 
              onClick={handleTorchToggle}
              disabled={!isScanning}
            >
              {torchEnabled ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
            </Button>
          )}
        </CardContent>

        {/* Erro */}
        {error && (
          <CardContent className="p-4 pt-0">
            <Alert>
              <AlertDescription>
                <strong>Erro:</strong>
                {error}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}

        {/* Instruções específicas para mobile */}
        {isMobile && (
          <CardContent className="p-4 pt-0">
            <div className="text-sm text-muted-foreground">
              <strong>📱 Dicas para mobile:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Mantenha o dispositivo estável</li>
                <li>Use boa iluminação</li>
                <li>Posicione o código no centro</li>
                {isIOS && <li>No iOS: toque na tela se o vídeo não iniciar</li>}
                {capabilities?.torch && <li>Use a lanterna em ambientes escuros</li>}
              </ul>
            </div>
          </CardContent>
        )}

        {/* Diagnósticos (se habilitado) */}
        {showDiagnostics && renderDiagnostics()}
      </Card>

      {/* CSS para animação de scan */}
      <style>{`
        @keyframes scan-line {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
}