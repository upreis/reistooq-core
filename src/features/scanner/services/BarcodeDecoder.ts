// =============================================================================
// BARCODE DECODER SERVICE - ZXing abstraction com otimizações
// =============================================================================

import { BarcodeFormat, ScanResult, ScannerError } from '../types/scanner.types';
import { BrowserMultiFormatReader } from '@zxing/browser';

export class BarcodeDecoder {
  private reader: BrowserMultiFormatReader;
  private isInitialized = false;
  private currentStream?: MediaStream;
  private decodingInterval?: NodeJS.Timeout;

  constructor() {
    this.reader = new BrowserMultiFormatReader();
  }

  async initialize(): Promise<void> {
    try {
      await BrowserMultiFormatReader.listVideoInputDevices();
      this.isInitialized = true;
      console.log('✅ [BarcodeDecoder] Initialized successfully');
    } catch (error) {
      console.error('❌ [BarcodeDecoder] Initialization failed:', error);
      throw new Error(ScannerError.DECODER_INITIALIZATION_FAILED);
    }
  }

  async startContinuousDecoding(
    videoElement: HTMLVideoElement,
    onResult: (result: ScanResult) => void,
    onError: (error: ScannerError) => void,
    deviceId?: string
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🎥 [BarcodeDecoder] Starting continuous decoding...');
      
      // Implementar timeout e retry mechanism para resolver message port errors
      const decodeWithTimeout = (timeout = 30000): Promise<void> => {
        return new Promise((resolve, reject) => {
          let isResolved = false;
          
          const timeoutId = setTimeout(() => {
            if (!isResolved) {
              isResolved = true;
              console.warn('⏰ [BarcodeDecoder] Decode timeout - implementing retry');
              reject(new Error('Decode timeout'));
            }
          }, timeout);

          const cleanup = () => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeoutId);
            }
          };

          try {
            this.reader.decodeFromVideoDevice(
              deviceId,
              videoElement,
              (result: any | null, error?: any) => {
                if (isResolved) return; // Previne callback duplicado
                
                if (result) {
                  cleanup();
                  const scanResult: ScanResult = {
                    code: result.getText(),
                    format: this.mapZXingFormat(result.getBarcodeFormat()),
                    timestamp: new Date(),
                    found: true,
                    confidence: 1.0
                  };
                  
                  console.log('✅ [BarcodeDecoder] Scan successful:', scanResult.code);
                  onResult(scanResult);
                  resolve();
                } else if (error && error.name !== 'NotFoundException') {
                  console.warn('⚠️ [BarcodeDecoder] Scan error:', error);
                  // Não considera NotFoundException como erro crítico
                  if (error.name === 'NotAllowedError' || error.name === 'NotReadableError') {
                    cleanup();
                    onError(ScannerError.CAMERA_ACCESS_FAILED);
                    reject(error);
                  }
                }
              }
            ).then(() => {
              if (!isResolved) {
                cleanup();
                resolve();
              }
            }).catch((err) => {
              cleanup();
              reject(err);
            });
          } catch (syncError) {
            cleanup();
            reject(syncError);
          }
        });
      };

      await decodeWithTimeout();
    } catch (error: any) {
      console.error('❌ [BarcodeDecoder] Failed to start decoding:', error);
      
      // Implementar retry mechanism para resolver problemas de Web Workers
      if (error.message === 'Decode timeout') {
        console.log('🔄 [BarcodeDecoder] Attempting retry after timeout...');
        setTimeout(() => {
          if (this.isInitialized) {
            this.startContinuousDecoding(videoElement, onResult, onError, deviceId);
          }
        }, 1000);
      } else {
        onError(ScannerError.CAMERA_ACCESS_FAILED);
      }
    }
  }

  async decodeFromImage(imageFile: File): Promise<ScanResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🖼️ [BarcodeDecoder] Decoding from image file...');
      
      const result = await this.reader.decodeFromImageUrl(URL.createObjectURL(imageFile));
      
      const scanResult: ScanResult = {
        code: result.getText(),
        format: this.mapZXingFormat(result.getBarcodeFormat()),
        timestamp: new Date(),
        found: true,
        confidence: 1.0
      };

      console.log('✅ [BarcodeDecoder] Image decode successful:', scanResult.code);
      return scanResult;
    } catch (error) {
      console.error('❌ [BarcodeDecoder] Image decode failed:', error);
      throw new Error(ScannerError.SCAN_TIMEOUT);
    }
  }

  async decodeFromImageElement(imageElement: HTMLImageElement): Promise<ScanResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await this.reader.decodeFromImageElement(imageElement);
      
      return {
        code: result.getText(),
        format: this.mapZXingFormat(result.getBarcodeFormat()),
        timestamp: new Date(),
        found: true,
        confidence: 1.0
      };
    } catch (error) {
      console.error('❌ [BarcodeDecoder] Image element decode failed:', error);
      throw new Error(ScannerError.SCAN_TIMEOUT);
    }
  }

  stopDecoding(): void {
    try {
      // Stop any active decoding
      
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop());
        this.currentStream = undefined;
      }

      if (this.decodingInterval) {
        clearInterval(this.decodingInterval);
        this.decodingInterval = undefined;
      }

      console.log('🛑 [BarcodeDecoder] Decoding stopped');
    } catch (error) {
      console.error('❌ [BarcodeDecoder] Error stopping decoder:', error);
    }
  }

  async getVideoInputDevices(): Promise<MediaDeviceInfo[]> {
    try {
      return await BrowserMultiFormatReader.listVideoInputDevices();
    } catch (error) {
      console.error('❌ [BarcodeDecoder] Failed to get video devices:', error);
      return [];
    }
  }

  // Performance optimization methods
  setHints(hints: Map<any, any>): void {
    try {
      this.reader.setHints(hints);
    } catch (error) {
      console.warn('⚠️ [BarcodeDecoder] Failed to set hints:', error);
    }
  }

  // Torch control (if supported)
  async toggleTorch(enable: boolean): Promise<void> {
    try {
      if (this.currentStream) {
        const track = this.currentStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        
        if ('torch' in capabilities) {
          await track.applyConstraints({
            advanced: [{ torch: enable } as any]
          });
          console.log(`💡 [BarcodeDecoder] Torch ${enable ? 'enabled' : 'disabled'}`);
        }
      }
    } catch (error) {
      console.warn('⚠️ [BarcodeDecoder] Torch control not supported:', error);
    }
  }

  // Map ZXing format to our enum
  private mapZXingFormat(zxingFormat: any): BarcodeFormat {
    const formatMap: Record<string, BarcodeFormat> = {
      'CODE_128': BarcodeFormat.CODE_128,
      'CODE_39': BarcodeFormat.CODE_39,
      'CODE_93': BarcodeFormat.CODE_93,
      'EAN_8': BarcodeFormat.EAN_8,
      'EAN_13': BarcodeFormat.EAN_13,
      'UPC_A': BarcodeFormat.UPC_A,
      'UPC_E': BarcodeFormat.UPC_E,
      'QR_CODE': BarcodeFormat.QR_CODE,
      'DATA_MATRIX': BarcodeFormat.DATA_MATRIX,
      'PDF_417': BarcodeFormat.PDF_417,
      'AZTEC': BarcodeFormat.AZTEC,
      'CODABAR': BarcodeFormat.CODABAR
    };

    return formatMap[zxingFormat.toString()] || BarcodeFormat.CODE_128;
  }

  // Cleanup resources
  dispose(): void {
    this.stopDecoding();
    this.isInitialized = false;
    console.log('🧹 [BarcodeDecoder] Resources disposed');
  }
}