import React, { useState, useEffect, useCallback, useRef, TouchEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Plus,
  GripHorizontal
} from 'lucide-react';
import { useModernBarcodeScanner } from '@/hooks/useModernBarcodeScanner';
import { cn } from '@/lib/utils';
import { feedbackSuccess, feedbackError, feedbackScanDetected } from './utils/scannerFeedback';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';

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
 * Fase 3: Polish - Gestos, animações suaves, tema
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
  
  // Gesture handling for bottom sheet
  const sheetY = useMotionValue(0);
  const sheetHeight = useTransform(sheetY, [-150, 0, 100], [280, 80, 40]);

  const scanner = useModernBarcodeScanner({
    preferredCamera: 'back',
    autoStart: false,
    scanDelay: 300
  });

  // Store stopCamera in a ref to avoid stale closures
  const stopCameraRef = useRef(scanner.stopCamera);
  stopCameraRef.current = scanner.stopCamera;
  
  // Auto-start scanner on mount
  useEffect(() => {
    let mounted = true;
    
    const initScanner = async () => {
      console.log('🎬 [MobileScannerLayout] Initializing scanner...');
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
      // Use ref to get latest stopCamera function
      stopCameraRef.current();
      setIsScanning(false);
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      console.log('🛑 [MobileScannerLayout] User paused scanning - STOPPING CAMERA');
      // Immediately update UI state
      setIsScanning(false);
      // Stop camera - this MUST release the hardware
      scanner.stopCamera();
      // Double-check after a small delay
      setTimeout(() => {
        console.log('🔄 [MobileScannerLayout] Verifying camera is stopped...');
        scanner.stopCamera();
      }, 100);
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

  // Handle sheet drag gestures
  const handleSheetDragEnd = useCallback((_: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.y < -threshold) {
      setIsHistoryExpanded(true);
    } else if (info.offset.y > threshold) {
      setIsHistoryExpanded(false);
    }
    sheetY.set(0);
  }, [sheetY]);

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      {/* Header - Minimal with blur (offset to avoid AppMobileHeader overlap) */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute top-12 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 via-black/50 to-transparent backdrop-blur-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Badge 
                variant={isScanning ? "default" : "secondary"} 
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-all duration-300",
                  isScanning && "bg-green-500/90 text-white shadow-lg shadow-green-500/30"
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
            </motion.div>
            
            {/* Continuous Mode Toggle */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setContinuousMode(!continuousMode)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
                continuousMode 
                  ? "bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30" 
                  : "bg-white/20 text-white/70"
              )}
            >
              <Repeat className={cn("w-3.5 h-3.5 transition-transform duration-500", continuousMode && "animate-spin-slow")} />
              Contínuo
            </motion.button>
          </div>
          
          {/* Torch Button */}
          <AnimatePresence>
            {scanner.torchSupported && isScanning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={scanner.toggleTorch}
                  className={cn(
                    "h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-300",
                    scanner.torchEnabled && "bg-yellow-500/30 shadow-lg shadow-yellow-500/20"
                  )}
                >
                  {scanner.torchEnabled ? (
                    <Flashlight className="w-6 h-6 text-yellow-400" />
                  ) : (
                    <FlashlightOff className="w-6 h-6" />
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Video Area - Fullscreen */}
      <div className="flex-1 relative bg-black">
        <video
          ref={scanner.videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        
        {/* Scanning Overlay with animations */}
        <AnimatePresence>
          {isScanning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 pointer-events-none"
            >
              {/* Dark overlay with transparent scan area */}
              <div className="absolute inset-0 bg-black/50">
                {/* Transparent horizontal scan area */}
                <div 
                  className="absolute left-4 right-4 h-32 top-1/2 -translate-y-1/2 bg-transparent rounded-2xl"
                  style={{ 
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                  }} 
                />
              </div>
              
              {/* Scan Frame with animated corners */}
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="absolute left-4 right-4 h-32 top-1/2 -translate-y-1/2"
              >
                {/* Animated corner guides */}
                <motion.div 
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-2xl" 
                />
                <motion.div 
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-2xl" 
                />
                <motion.div 
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-2xl" 
                />
                <motion.div 
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                  className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-2xl" 
                />
                
                {/* Center line */}
                <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-primary/40 -translate-y-1/2" />
                
                {/* Animated scan line */}
                <motion.div 
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full shadow-lg shadow-primary/50"
                />
              </motion.div>
              
              {/* Instruction */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="absolute top-1/2 translate-y-20 left-0 right-0 text-center"
              >
                <p className="text-white/90 text-sm font-medium px-4 drop-shadow-lg">
                  Posicione o código de barras na área marcada
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Placeholder when camera is off */}
        <AnimatePresence>
          {!scanner.isActive && !scanner.isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center bg-background/95"
            >
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center text-foreground px-6"
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Camera className="w-20 h-20 mx-auto mb-4 text-muted-foreground/40" />
                </motion.div>
                <p className="text-lg text-muted-foreground">Câmera pausada</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Toque no botão abaixo para iniciar</p>

                {scanner.blockedByPolicy && (
                  <div className="mt-4 rounded-xl border bg-muted/30 p-3 text-sm">
                    <p className="font-medium">Câmera bloqueada nesta visualização</p>
                    <p className="mt-1 text-muted-foreground">
                      No preview do editor a câmera pode ser bloqueada. Abra o scanner em uma nova aba para permitir.
                    </p>
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        onClick={() => window.open(window.location.href, '_blank', 'noopener,noreferrer')}
                      >
                        Abrir em nova aba
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scan Result Feedback Toast with animation */}
        <AnimatePresence>
          {showFeedback && lastScanResult && (
            <motion.div 
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                "absolute top-32 left-4 right-4 z-30 p-4 rounded-2xl shadow-2xl backdrop-blur-sm",
                lastScanResult.type === 'success' && "bg-green-500/95 text-white shadow-green-500/30",
                lastScanResult.type === 'error' && "bg-amber-500/95 text-white shadow-amber-500/30",
                lastScanResult.type === 'new' && "bg-blue-500/95 text-white shadow-blue-500/30"
              )}
            >
              <div className="flex items-start gap-3">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-white/20"
                >
                  {lastScanResult.type === 'success' && <Check className="w-6 h-6" />}
                  {lastScanResult.type === 'error' && <AlertCircle className="w-6 h-6" />}
                  {lastScanResult.type === 'new' && <Plus className="w-6 h-6" />}
                </motion.div>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Controls - Thumb Zone with animations */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="absolute bottom-20 left-0 right-0 z-20 bg-gradient-to-t from-background via-background/95 to-transparent pt-8"
      >
        {/* Manual Input */}
        <AnimatePresence>
          {showManualInput && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 pb-4 overflow-hidden"
            >
              <div className="flex gap-2 bg-muted/20 p-2 rounded-xl backdrop-blur-sm">
                <Input
                  placeholder="Digite o código..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                  className="flex-1 h-14 text-lg bg-background/90 border-0"
                  autoFocus
                />
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={handleManualSubmit}
                    disabled={!manualCode.trim()}
                    size="icon"
                    className="h-14 w-14 shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={() => setShowManualInput(false)}
                    variant="ghost"
                    size="icon"
                    className="h-14 w-14 shrink-0 text-foreground hover:bg-muted"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Action Buttons */}
        <div className="px-4 pb-4">
          <div className="flex gap-3">
            {/* Manual Input Toggle */}
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowManualInput(!showManualInput)}
                className={cn(
                  "h-16 w-16 rounded-2xl border-border/50 bg-muted/50 text-foreground hover:bg-muted transition-all duration-300",
                  showManualInput && "bg-primary/20 border-primary"
                )}
              >
                <Keyboard className="w-6 h-6" />
              </Button>
            </motion.div>
            
            {/* Main Scan Toggle Button */}
            <motion.div 
              whileTap={{ scale: 0.98 }}
              className="flex-1"
            >
              <Button
                onClick={handleToggleScanning}
                disabled={scanner.isLoading}
                size="lg"
                className={cn(
                  "w-full h-16 text-lg font-semibold rounded-2xl transition-all duration-300",
                  isScanning 
                    ? "bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/30" 
                    : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
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
            </motion.div>
          </div>
        </div>

        {/* History Bottom Sheet with gestures */}
        <AnimatePresence>
          {scanHistory.length > 0 && (
            <motion.div 
              drag="y"
              dragConstraints={{ top: -150, bottom: 50 }}
              dragElastic={0.2}
              onDragEnd={handleSheetDragEnd}
              animate={{ 
                height: isHistoryExpanded ? 280 : 80,
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-card rounded-t-3xl shadow-2xl cursor-grab active:cursor-grabbing overflow-hidden"
            >
              {/* History Header - Drag Handle */}
              <button
                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                className="w-full px-4 py-3 flex flex-col items-center"
              >
                {/* Drag indicator */}
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mb-2" />
                
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">Histórico</span>
                    <Badge variant="secondary" className="ml-1">
                      {scanHistory.length}
                    </Badge>
                  </div>
                  <motion.div
                    animate={{ rotate: isHistoryExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                </div>
              </button>
              
              {/* History List */}
              <motion.div 
                animate={{ 
                  opacity: isHistoryExpanded ? 1 : 0,
                }}
                transition={{ duration: 0.2 }}
                className="overflow-y-auto h-[200px] px-4 pb-4"
              >
                <div className="space-y-2">
                  {scanHistory.slice(0, 10).map((scan, index) => (
                    <motion.div 
                      key={`${scan.code}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
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
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Safe area for iOS */}
        <div className="h-safe-area-inset-bottom bg-background" />
      </motion.div>
    </div>
  );
}
