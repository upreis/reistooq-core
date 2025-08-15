// =============================================================================
// SCANNER SERVICE - Business logic orchestration
// =============================================================================

import { 
  ScannedProduct, 
  ScanResult, 
  ScanHistory, 
  ScannerSettings, 
  MovementRequest, 
  ScanAction,
  ScannerAnalytics,
  ScannerSessionStats,
  BarcodeFormat
} from '../types/scanner.types';
import { BarcodeDecoder } from './BarcodeDecoder';
import { ProductLookup } from './ProductLookup';

export class ScannerService {
  private decoder: BarcodeDecoder;
  private productLookup: ProductLookup;
  private scanHistory: ScanHistory[] = [];
  private sessionStats: ScannerSessionStats;
  private sessionId: string;

  constructor() {
    this.decoder = new BarcodeDecoder();
    this.productLookup = new ProductLookup();
    this.sessionId = crypto.randomUUID();
    this.sessionStats = this.initializeSessionStats();
    
    console.log('🚀 [ScannerService] Initialized with session:', this.sessionId);
  }

  // ==========================================================================
  // CORE SCANNING METHODS
  // ==========================================================================

  async initialize(): Promise<void> {
    try {
      await this.decoder.initialize();
      console.log('✅ [ScannerService] Service initialized successfully');
    } catch (error) {
      console.error('❌ [ScannerService] Initialization failed:', error);
      throw error;
    }
  }

  async scanBarcode(code: string): Promise<ScanResult> {
    const startTime = Date.now();
    this.sessionStats.scans_attempted++;

    try {
      console.log(`🔍 [ScannerService] Processing scan: ${code}`);

      // Look up product
      const product = await this.productLookup.findByBarcode(code);
      
      const scanResult: ScanResult = {
        code,
        format: this.detectBarcodeFormat(code),
        timestamp: new Date(),
        product: product || undefined,
        found: !!product
      };

      // Update session stats
      if (product) {
        this.sessionStats.scans_successful++;
        this.sessionStats.products_found++;
      }

      // Record in history
      await this.recordScanHistory(scanResult);
      
      // Update average scan time
      const scanTime = Date.now() - startTime;
      this.updateAverageScanTime(scanTime);

      console.log(`✅ [ScannerService] Scan completed in ${scanTime}ms`, {
        found: scanResult.found,
        product: product?.nome
      });

      return scanResult;
    } catch (error) {
      console.error('❌ [ScannerService] Scan failed:', error);
      throw error;
    }
  }

  async scanWithAction(code: string, action: ScanAction, options?: any): Promise<ScanResult> {
    try {
      const scanResult = await this.scanBarcode(code);
      
      if (scanResult.found && scanResult.product) {
        await this.executeScanAction(scanResult.product, action, options);
        this.sessionStats.actions_taken++;
        
        // Update history with action
        const historyEntry = this.scanHistory[this.scanHistory.length - 1];
        if (historyEntry) {
          historyEntry.action_taken = action;
        }
      }

      return scanResult;
    } catch (error) {
      console.error('❌ [ScannerService] Scan with action failed:', error);
      throw error;
    }
  }

  async searchProducts(query: string, filters?: any): Promise<ScannedProduct[]> {
    try {
      console.log(`🔍 [ScannerService] Searching products: ${query}`);
      
      // Try different search strategies
      const results: ScannedProduct[] = [];
      
      // 1. Exact barcode match
      if (this.looksLikeBarcode(query)) {
        const exactMatch = await this.productLookup.findByBarcode(query);
        if (exactMatch) results.push(exactMatch);
      }
      
      // 2. SKU match
      const skuMatch = await this.productLookup.findBySku(query);
      if (skuMatch && !results.find(p => p.id === skuMatch.id)) {
        results.push(skuMatch);
      }
      
      // 3. Name search
      const nameMatches = await this.productLookup.findByName(query);
      nameMatches.forEach(product => {
        if (!results.find(p => p.id === product.id)) {
          results.push(product);
        }
      });
      
      // 4. Advanced search if no results
      if (results.length === 0) {
        const advancedResults = await this.productLookup.search(query, filters);
        results.push(...advancedResults);
      }

      console.log(`✅ [ScannerService] Search found ${results.length} products`);
      return results;
    } catch (error) {
      console.error('❌ [ScannerService] Product search failed:', error);
      throw error;
    }
  }

  // ==========================================================================
  // STOCK MOVEMENT METHODS
  // ==========================================================================

  async executeStockMovement(productId: string, movement: MovementRequest): Promise<boolean> {
    try {
      console.log(`📦 [ScannerService] Executing stock movement:`, movement);
      
      const success = await this.productLookup.updateStock(productId, movement);
      
      if (success) {
        this.sessionStats.actions_taken++;
        console.log('✅ [ScannerService] Stock movement completed successfully');
      }

      return success;
    } catch (error) {
      console.error('❌ [ScannerService] Stock movement failed:', error);
      throw error;
    }
  }

  async batchStockMovement(movements: MovementRequest[]): Promise<void> {
    try {
      console.log(`📦 [ScannerService] Executing batch movement: ${movements.length} items`);
      
      const result = await this.productLookup.batchUpdate(movements);
      
      this.sessionStats.actions_taken += result.success_count;
      
      console.log(`✅ [ScannerService] Batch completed: ${result.success_count}/${movements.length} successful`);
      
      if (result.errors.length > 0) {
        console.warn('⚠️ [ScannerService] Batch had errors:', result.errors);
      }
    } catch (error) {
      console.error('❌ [ScannerService] Batch movement failed:', error);
      throw error;
    }
  }

  // ==========================================================================
  // CAMERA & DECODER METHODS
  // ==========================================================================

  async startContinuousScanning(
    videoElement: HTMLVideoElement,
    onScan: (result: ScanResult) => void,
    onError: (error: any) => void,
    deviceId?: string
  ): Promise<void> {
    try {
      await this.decoder.startContinuousDecoding(
        videoElement,
        async (result) => {
          try {
            const enhancedResult = await this.scanBarcode(result.code);
            onScan(enhancedResult);
          } catch (error) {
            onError(error);
          }
        },
        onError,
        deviceId
      );
    } catch (error) {
      console.error('❌ [ScannerService] Failed to start continuous scanning:', error);
      throw error;
    }
  }

  stopScanning(): void {
    this.decoder.stopDecoding();
    console.log('🛑 [ScannerService] Scanning stopped');
  }

  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    return await this.decoder.getVideoInputDevices();
  }

  async toggleTorch(enabled: boolean): Promise<void> {
    await this.decoder.toggleTorch(enabled);
  }

  async scanFromImage(imageFile: File): Promise<ScanResult> {
    try {
      console.log('🖼️ [ScannerService] Scanning from image file');
      
      const decoderResult = await this.decoder.decodeFromImage(imageFile);
      const enhancedResult = await this.scanBarcode(decoderResult.code);
      
      return enhancedResult;
    } catch (error) {
      console.error('❌ [ScannerService] Image scan failed:', error);
      throw error;
    }
  }

  // ==========================================================================
  // ANALYTICS & HISTORY
  // ==========================================================================

  getSessionStats(): ScannerSessionStats {
    this.sessionStats.session_duration = Date.now() - this.sessionStartTime;
    return { ...this.sessionStats };
  }

  getScanHistory(limit = 50): ScanHistory[] {
    return this.scanHistory.slice(-limit);
  }

  async getAnalytics(): Promise<ScannerAnalytics> {
    // This would typically fetch from a proper analytics service
    const stats = this.getSessionStats();
    
    return {
      daily_scans: stats.scans_attempted,
      success_rate: stats.scans_attempted > 0 ? (stats.scans_successful / stats.scans_attempted) * 100 : 0,
      popular_products: this.getPopularProducts(),
      performance_metrics: {
        average_scan_time: stats.average_scan_time,
        cache_hit_rate: this.getCacheHitRate(),
        error_rate: stats.scans_attempted > 0 ? ((stats.scans_attempted - stats.scans_successful) / stats.scans_attempted) * 100 : 0
      },
      usage_patterns: {
        peak_hours: [9, 10, 14, 15, 16], // Mock data
        device_types: { mobile: 80, desktop: 20 }
      }
    };
  }

  clearHistory(): void {
    this.scanHistory = [];
    console.log('🧹 [ScannerService] Scan history cleared');
  }

  // ==========================================================================
  // EXPORT/IMPORT
  // ==========================================================================

  async exportData(): Promise<Blob> {
    const exportData = {
      session_id: this.sessionId,
      session_stats: this.getSessionStats(),
      scan_history: this.scanHistory,
      exported_at: new Date().toISOString(),
      cache_stats: this.productLookup.getCacheStats()
    };

    const jsonData = JSON.stringify(exportData, null, 2);
    return new Blob([jsonData], { type: 'application/json' });
  }

  async importData(file: File): Promise<void> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.scan_history && Array.isArray(data.scan_history)) {
        this.scanHistory.push(...data.scan_history);
        console.log(`✅ [ScannerService] Imported ${data.scan_history.length} scan records`);
      }
    } catch (error) {
      console.error('❌ [ScannerService] Import failed:', error);
      throw error;
    }
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private sessionStartTime = Date.now();

  private initializeSessionStats(): ScannerSessionStats {
    return {
      scans_attempted: 0,
      scans_successful: 0,
      products_found: 0,
      unique_products: 0,
      session_duration: 0,
      average_scan_time: 0,
      actions_taken: 0
    };
  }

  private async recordScanHistory(scanResult: ScanResult): Promise<void> {
    const historyEntry: ScanHistory = {
      id: crypto.randomUUID(),
      codigo: scanResult.code,
      produto: scanResult.product,
      found: scanResult.found,
      timestamp: scanResult.timestamp,
      session_id: this.sessionId,
      user_id: 'current-user', // This should come from auth context
      location: undefined // Could be added with geolocation
    };

    this.scanHistory.push(historyEntry);
    
    // Keep only last 1000 entries to manage memory
    if (this.scanHistory.length > 1000) {
      this.scanHistory = this.scanHistory.slice(-1000);
    }
  }

  private async executeScanAction(product: ScannedProduct, action: ScanAction, options?: any): Promise<void> {
    switch (action) {
      case ScanAction.STOCK_IN:
        await this.executeStockMovement(product.id, {
          produto_id: product.id,
          tipo_movimentacao: 'entrada',
          quantidade: options?.quantidade || 1,
          motivo: options?.motivo || 'Scanner entry',
          observacoes: options?.observacoes
        });
        break;
        
      case ScanAction.STOCK_OUT:
        await this.executeStockMovement(product.id, {
          produto_id: product.id,
          tipo_movimentacao: 'saida',
          quantidade: options?.quantidade || 1,
          motivo: options?.motivo || 'Scanner exit',
          observacoes: options?.observacoes
        });
        break;
        
      case ScanAction.STOCK_ADJUST:
        await this.executeStockMovement(product.id, {
          produto_id: product.id,
          tipo_movimentacao: 'ajuste',
          quantidade: options?.quantidade || product.quantidade_atual,
          motivo: options?.motivo || 'Scanner adjustment',
          observacoes: options?.observacoes
        });
        break;
        
      case ScanAction.VIEW:
      case ScanAction.STOCK_CHECK:
        // No action needed, just viewing/checking
        break;
        
      default:
        console.warn('⚠️ [ScannerService] Unknown scan action:', action);
    }
  }

  private updateAverageScanTime(scanTime: number): void {
    const totalScans = this.sessionStats.scans_attempted;
    const currentAverage = this.sessionStats.average_scan_time;
    
    this.sessionStats.average_scan_time = 
      ((currentAverage * (totalScans - 1)) + scanTime) / totalScans;
  }

  private detectBarcodeFormat(code: string): BarcodeFormat {
    // Simple format detection based on length and pattern
    if (code.length === 8) return BarcodeFormat.EAN_8;
    if (code.length === 13) return BarcodeFormat.EAN_13;
    if (code.length === 12) return BarcodeFormat.UPC_A;
    if (code.length >= 20) return BarcodeFormat.QR_CODE;
    
    return BarcodeFormat.CODE_128; // Default
  }

  private looksLikeBarcode(query: string): boolean {
    return /^\d{8,13}$/.test(query);
  }

  private getPopularProducts(): Array<{product_id: string, scan_count: number, last_scanned: Date}> {
    const productCounts = new Map<string, {count: number, lastScan: Date}>();
    
    this.scanHistory.forEach(scan => {
      if (scan.produto) {
        const existing = productCounts.get(scan.produto.id);
        productCounts.set(scan.produto.id, {
          count: (existing?.count || 0) + 1,
          lastScan: scan.timestamp
        });
      }
    });

    return Array.from(productCounts.entries())
      .map(([productId, data]) => ({
        product_id: productId,
        scan_count: data.count,
        last_scanned: data.lastScan
      }))
      .sort((a, b) => b.scan_count - a.scan_count)
      .slice(0, 10);
  }

  private getCacheHitRate(): number {
    const stats = this.productLookup.getCacheStats();
    return stats.hitRate || 0;
  }

  // Cleanup resources
  dispose(): void {
    this.decoder.dispose();
    this.scanHistory = [];
    console.log('🧹 [ScannerService] Service disposed');
  }
}
