import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Camera, 
  CameraOff, 
  Flashlight, 
  FlashlightOff, 
  Keyboard,
  X,
  ChevronUp,
  ChevronDown,
  Package,
  Clock,
  Check,
  AlertCircle,
  Loader2,
  Send,
  Repeat,
  Plus
} from 'lucide-react';
import { useModernBarcodeScanner } from '@/hooks/useModernBarcodeScanner';
import { cn } from '@/lib/utils';
import { feedbackSuccess, feedbackError, feedbackScanDetected } from './utils/scannerFeedback';

interface ScanHistoryItem {
  code: string;
  timestamp: Date;
  product?: {
    id?: string;
    nome: string;
    quantidade_atual: number;
  };
}

interface ScanFeedback {
  type: 'success' | 'error' | 'new';
  message: string;
  productName?: string;
  code: string;
}

interface MobileScannerLayoutProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
  scanHistory?: ScanHistoryItem[];
  isProcessing?: boolean;
  lastScanResult?: ScanFeedback | null;
}

/**
 * Layout mobile-first otimizado para scanner de código de barras
 * Fase 2: UX Workflow - Feedback visual, sons, modo contínuo
 */
export function MobileScannerLayout({ 
  onScan, 
  onError,
  scanHistory = [],
  isProcessing = false,
  lastScanResult
}: MobileScannerLayoutProps) {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [continuousMode, setContinuousMode] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout>();

  const scanner = useModernBarcodeScanner({
    preferredCamera: 'back',
    autoStart: false,
    scanDelay: 300
  });

  // Auto-start scanner on mount
  useEffect(() => {
    let mounted = true;
    
    const initScanner = async () => {
      const started = await scanner.startCamera();
      if (started && mounted) {
        setIsScanning(true);
        scanner.startScanning((code) => {
          feedbackScanDetected();
          onScan(code);
        });
      }
    };
    
    initScanner();
    
    // Cleanup function - properly stop camera when component unmounts
    return () => {
      mounted = false;
      console.log('🧹 [MobileScannerLayout] Unmounting - stopping camera');
      scanner.stopCamera();
      setIsScanning(false);
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []); // Empty deps - run only on mount/unmount

  // Show feedback toast when scan result changes
  useEffect(() => {
    if (lastScanResult) {
      // Play audio/haptic feedback based on result
      if (lastScanResult.type === 'success') {
        feedbackSuccess();
      } else if (lastScanResult.type === 'error' || lastScanResult.type === 'new') {
        feedbackError();
      }
      
      // Show visual feedback
      setShowFeedback(true);
      
      // Auto-hide after 2.5 seconds
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      feedbackTimeoutRef.current = setTimeout(() => {
        setShowFeedback(false);
      }, 2500);
    }
  }, [lastScanResult]);

  const handleToggleScanning = useCallback(async () => {
    if (isScanning) {
      console.log('🛑 [MobileScannerLayout] User paused scanning');
      scanner.stopCamera();
      setIsScanning(false);
    } else {
      console.log('▶️ [MobileScannerLayout] User resumed scanning');
      const started = await scanner.startCamera();
      if (started) {
        setIsScanning(true);
        scanner.startScanning((code) => {
          feedbackScanDetected();
          onScan(code);
        });
      } else {
        onError?.(scanner.error || 'Falha ao iniciar câmera');
      }
    }
  }, [isScanning, scanner, onScan, onError]);

  const handleManualSubmit = useCallback(() => {
    const code = manualCode.trim();
    if (!code) return;
    
    if (code.length > 100) {
      onError?.('Código muito longo');
      return;
    }
    
    if (!/^[A-Za-z0-9\-_]+$/.test(code)) {
      onError?.('Código contém caracteres inválidos');
      return;
    }
    
    onScan(code);
    setManualCode('');
    setShowManualInput(false);
  }, [manualCode, onScan, onError]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header - Minimal */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge 
              variant={isScanning ? "default" : "secondary"} 
              className={cn(
                "px-3 py-1.5 text-sm font-medium",
                isScanning && "bg-green-500/90 text-white"
              )}
            >
              {scanner.isLoading && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
              {isProcessing && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
              {scanner.error && <AlertCircle className="w-3 h-3 mr-1.5" />}
              {isScanning && !isProcessing && <div className="w-2 h-2 mr-1.5 bg-white rounded-full animate-pulse" />}
              {scanner.isLoading ? 'Iniciando...' : 
               isProcessing ? 'Processando...' :
               scanner.error ? 'Erro' : 
               isScanning ? 'Escaneando' : 'Pausado'}
            </Badge>
            
            {/* Continuous Mode Toggle */}
            <button
              onClick={() => setContinuousMode(!continuousMode)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                continuousMode 
                  ? "bg-primary/90 text-primary-foreground" 
                  : "bg-white/20 text-white/70"
              )}
            >
              <Repeat className={cn("w-3.5 h-3.5", continuousMode && "animate-spin-slow")} />
              Contínuo
            </button>
          </div>
          
          {/* Torch Button */}
          {scanner.torchSupported && isScanning && (
            <Button
              variant="ghost"
              size="icon"
              onClick={scanner.toggleTorch}
              className="h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              {scanner.torchEnabled ? (
                <Flashlight className="w-6 h-6 text-yellow-400" />
              ) : (
                <FlashlightOff className="w-6 h-6" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Video Area - Fullscreen */}
      <div className="flex-1 relative">
        <video
          ref={scanner.videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        
        {/* Scanning Overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Dark overlay with transparent scan area */}
            <div className="absolute inset-0 bg-black/50">
              {/* Transparent horizontal scan area - 16:9 aspect optimized for barcodes */}
              <div 
                className="absolute left-4 right-4 h-32 top-1/2 -translate-y-1/2 bg-transparent rounded-2xl"
                style={{ 
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                }} 
              />
            </div>
            
            {/* Scan Frame with animated corners */}
            <div className="absolute left-4 right-4 h-32 top-1/2 -translate-y-1/2">
              {/* Corner guides */}
              <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
              <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
              <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
              <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-2xl" />
              
              {/* Center line */}
              <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-primary/40 -translate-y-1/2" />
              
              {/* Animated scan line */}
              <div 
                className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
                style={{
                  animation: 'scan-line 2s ease-in-out infinite'
                }}
              />
            </div>
            
            {/* Instruction */}
            <div className="absolute top-1/2 translate-y-20 left-0 right-0 text-center">
              <p className="text-white/90 text-sm font-medium px-4">
                Posicione o código de barras na área marcada
              </p>
            </div>
          </div>
        )}
        
        {/* Placeholder when camera is off */}
        {!scanner.isActive && !scanner.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90">
            <div className="text-center text-white">
              <Camera className="w-20 h-20 mx-auto mb-4 opacity-40" />
              <p className="text-lg opacity-60">Câmera pausada</p>
              <p className="text-sm opacity-40 mt-1">Toque no botão abaixo para iniciar</p>
            </div>
          </div>
        )}

        {/* Scan Result Feedback Toast */}
        {showFeedback && lastScanResult && (
          <div 
            className={cn(
              "absolute top-20 left-4 right-4 z-30 p-4 rounded-2xl shadow-2xl",
              "transform transition-all duration-300 ease-out",
              "animate-in slide-in-from-top-4 fade-in",
              lastScanResult.type === 'success' && "bg-green-500/95 text-white",
              lastScanResult.type === 'error' && "bg-amber-500/95 text-white",
              lastScanResult.type === 'new' && "bg-blue-500/95 text-white"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                lastScanResult.type === 'success' && "bg-white/20",
                lastScanResult.type === 'error' && "bg-white/20",
                lastScanResult.type === 'new' && "bg-white/20"
              )}>
                {lastScanResult.type === 'success' && <Check className="w-6 h-6" />}
                {lastScanResult.type === 'error' && <AlertCircle className="w-6 h-6" />}
                {lastScanResult.type === 'new' && <Plus className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base">
                  {lastScanResult.type === 'success' && 'Produto encontrado'}
                  {lastScanResult.type === 'error' && 'Não encontrado'}
                  {lastScanResult.type === 'new' && 'Novo produto'}
                </p>
                {lastScanResult.productName && (
                  <p className="text-sm opacity-90 truncate">{lastScanResult.productName}</p>
                )}
                <code className="text-xs opacity-75 font-mono">{lastScanResult.code}</code>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls - Thumb Zone */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black via-black/95 to-transparent pt-8">
        {/* Manual Input */}
        {showManualInput && (
          <div className="px-4 pb-4">
            <div className="flex gap-2 bg-muted/20 p-2 rounded-xl backdrop-blur-sm">
              <Input
                placeholder="Digite o código..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                className="flex-1 h-14 text-lg bg-background/90 border-0"
                autoFocus
              />
              <Button 
                onClick={handleManualSubmit}
                disabled={!manualCode.trim()}
                size="icon"
                className="h-14 w-14 shrink-0"
              >
                <Send className="w-5 h-5" />
              </Button>
              <Button 
                onClick={() => setShowManualInput(false)}
                variant="ghost"
                size="icon"
                className="h-14 w-14 shrink-0 text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Main Action Buttons */}
        <div className="px-4 pb-4">
          <div className="flex gap-3">
            {/* Manual Input Toggle */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowManualInput(!showManualInput)}
              className={cn(
                "h-16 w-16 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/20",
                showManualInput && "bg-primary/20 border-primary"
              )}
            >
              <Keyboard className="w-6 h-6" />
            </Button>
            
            {/* Main Scan Toggle Button */}
            <Button
              onClick={handleToggleScanning}
              disabled={scanner.isLoading}
              size="lg"
              className={cn(
                "flex-1 h-16 text-lg font-semibold rounded-2xl",
                isScanning 
                  ? "bg-destructive hover:bg-destructive/90" 
                  : "bg-primary hover:bg-primary/90"
              )}
            >
              {scanner.isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : isScanning ? (
                <>
                  <CameraOff className="w-6 h-6 mr-2" />
                  Pausar Scanner
                </>
              ) : (
                <>
                  <Camera className="w-6 h-6 mr-2" />
                  Iniciar Scanner
                </>
              )}
            </Button>
          </div>
        </div>

        {/* History Bottom Sheet */}
        {scanHistory.length > 0 && (
          <div 
            className={cn(
              "bg-background rounded-t-3xl transition-all duration-300 ease-out",
              isHistoryExpanded ? "max-h-72" : "max-h-20"
            )}
          >
            {/* History Header - Drag Handle */}
            <button
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Histórico</span>
                <Badge variant="secondary" className="ml-1">
                  {scanHistory.length}
                </Badge>
              </div>
              {isHistoryExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {/* History List */}
            <div className={cn(
              "overflow-y-auto transition-all duration-300",
              isHistoryExpanded ? "max-h-52 opacity-100" : "max-h-0 opacity-0"
            )}>
              <div className="px-4 pb-4 space-y-2">
                {scanHistory.slice(0, 10).map((scan, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded truncate max-w-32">
                          {scan.code}
                        </code>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatTime(scan.timestamp)}
                        </span>
                      </div>
                      
                      {scan.product ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Package className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-foreground truncate">{scan.product.nome}</span>
                          <span className="text-muted-foreground shrink-0">
                            ({scan.product.quantidade_atual} un)
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Produto não encontrado
                        </p>
                      )}
                    </div>
                    
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 ml-2",
                      scan.product ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"
                    )}>
                      {scan.product ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Safe area for iOS */}
        <div className="h-safe-area-inset-bottom bg-background" />
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes scan-line {
          0%, 100% { top: 0; }
          50% { top: calc(100% - 4px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
