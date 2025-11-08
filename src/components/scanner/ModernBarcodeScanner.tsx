import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  CameraOff, 
  Flashlight, 
  FlashlightOff, 
  Keyboard,
  Image,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useModernBarcodeScanner } from '@/hooks/useModernBarcodeScanner';
import { toast } from 'sonner';

interface ModernBarcodeScannerProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
  preferredCamera?: 'front' | 'back';
}

export function ModernBarcodeScanner({ 
  onScan, 
  onError, 
  autoStart = false,
  preferredCamera = 'back'
}: ModernBarcodeScannerProps) {
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const scanner = useModernBarcodeScanner({
    preferredCamera,
    autoStart: false,
    scanDelay: 300
  });

  const handleStartScanning = async () => {
    const started = await scanner.startCamera();
    if (started) {
      setIsScanning(true);
      scanner.startScanning((code) => {
        onScan(code);
      });
    } else {
      onError?.(scanner.error || 'Failed to start camera');
    }
  };

  const handleStopScanning = () => {
    console.log('🛑 [ModernBarcodeScanner] Stop button clicked');
    scanner.stopCamera(); // Para a câmera PRIMEIRO
    setIsScanning(false); // Depois atualiza o estado
  };

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    
    if (!code) return;
    
    // ✅ PROBLEMA 4: Validação de segurança - limite de tamanho
    if (code.length > 100) {
      toast.error('Código de barras inválido (muito longo)');
      return;
    }
    
    // ✅ PROBLEMA 4: Validação de segurança - apenas caracteres seguros
    if (!/^[A-Za-z0-9\-_]+$/.test(code)) {
      toast.error('Código de barras contém caracteres inválidos');
      return;
    }
    
    onScan(code);
    setManualCode('');
    setShowManualInput(false);
    toast.success(`Código manual: ${code}`);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      const url = URL.createObjectURL(file);
      
      const result = await reader.decodeFromImageUrl(url);
      const code = result.getText();
      
      onScan(code);
      toast.success(`Código da imagem: ${code}`);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to read barcode from image:', error);
      toast.error('Nenhum código encontrado na imagem');
    } finally {
      event.target.value = '';
    }
  };

  const getStatusColor = () => {
    if (scanner.error) return 'destructive';
    if (isScanning) return 'default';
    if (scanner.hasPermission) return 'secondary';
    return 'outline';
  };

  const getStatusText = () => {
    if (scanner.error) return scanner.error;
    if (scanner.isLoading) return 'Iniciando câmera...';
    if (isScanning) return 'Escaneamento ativo';
    if (scanner.hasPermission === false) return 'Permissão de câmera necessária';
    if (scanner.hasPermission === null) return 'Verificando permissões...';
    return 'Pronto para escanear';
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Status Badge */}
      <div className="flex items-center justify-center">
        <Badge variant={getStatusColor()} className="px-3 py-1">
          {scanner.isLoading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
          {scanner.error && <AlertCircle className="w-3 h-3 mr-1" />}
          {isScanning && <CheckCircle className="w-3 h-3 mr-1" />}
          {getStatusText()}
        </Badge>
      </div>

      {/* Main Scanner Card */}
      <Card>
        <CardContent className="p-4">
          {/* Video Container */}
          <div className="relative aspect-square bg-black rounded-lg overflow-hidden mb-4">
            <video
              ref={scanner.videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            
            {/* Scanning Overlay - Enhanced Visual Guides */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Dark overlay except scan area */}
                <div className="absolute inset-0 bg-black/60">
                  {/* Transparent scan area */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[140px] bg-transparent border-2 border-transparent" 
                       style={{ 
                         boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                         borderRadius: '12px'
                       }} 
                  />
                </div>
                
                {/* Scan Frame with corner guides */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[140px] rounded-xl">
                  {/* Corner guides - Top Left */}
                  <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-xl animate-pulse" />
                  {/* Top Right */}
                  <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-xl animate-pulse" />
                  {/* Bottom Left */}
                  <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-xl animate-pulse" />
                  {/* Bottom Right */}
                  <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-xl animate-pulse" />
                  
                  {/* Center alignment guides */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/30 -translate-y-1/2" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary/30 -translate-x-1/2" />
                </div>
                
                {/* Animated scan line */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[140px] overflow-hidden rounded-xl">
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" 
                       style={{
                         animation: 'scan-line 2s ease-in-out infinite'
                       }}
                  />
                </div>

                {/* Instructions */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <div className="inline-flex flex-col items-center gap-1 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      Centralize todo o código na área marcada
                    </div>
                    <div className="text-xs opacity-75">
                      Mantenha o código visível por completo
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Placeholder when not active */}
            {!scanner.isActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <Camera className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p className="text-sm opacity-75">Câmera não ativa</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-3">
            {/* Primary Actions */}
            {!isScanning ? (
              <Button 
                onClick={handleStartScanning}
                disabled={scanner.isLoading || scanner.hasPermission === false}
                size="lg"
                className="w-full h-14 text-lg"
              >
                {scanner.isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 mr-2" />
                    Iniciar Scanner
                  </>
                )}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  onClick={handleStopScanning}
                  variant="destructive"
                  size="lg"
                  className="flex-1 h-14"
                >
                  <CameraOff className="w-5 h-5 mr-2" />
                  Parar
                </Button>
                
                {scanner.torchSupported && (
                  <Button 
                    onClick={scanner.toggleTorch}
                    variant="outline"
                    size="lg"
                    className="h-14 px-4"
                  >
                    {scanner.torchEnabled ? (
                      <FlashlightOff className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <Flashlight className="w-5 h-5" />
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Camera Selection */}
            {scanner.devices.length > 1 && (
              <Select 
                value={scanner.currentDevice || ''} 
                onValueChange={scanner.switchCamera}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar câmera" />
                </SelectTrigger>
                <SelectContent>
                  {scanner.devices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Câmera ${device.deviceId.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Alternative Input Methods */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => setShowManualInput(!showManualInput)}
                variant="outline"
                size="lg"
                className="flex-1 h-12"
              >
                <Keyboard className="w-4 h-4 mr-2" />
                Entrada Manual
              </Button>
              
              <label className="flex-1">
                <Button 
                  variant="outline"
                  size="lg"
                  className="w-full h-12"
                  asChild
                >
                  <span>
                    <Image className="w-4 h-4 mr-2" />
                    Da Imagem
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Input */}
      {showManualInput && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">Digite o código manualmente:</label>
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
                  Enviar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
