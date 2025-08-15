// =============================================================================
// SCANNER TYPES - Tipagem completa e robusta para o sistema de scanner
// =============================================================================

export interface ScannedProduct {
  id: string;
  sku_interno: string;
  nome: string;
  descricao?: string;
  codigo_barras?: string;
  categoria?: string;
  quantidade_atual: number;
  estoque_minimo: number;
  estoque_maximo: number;
  preco_custo?: number;
  preco_venda?: number;
  url_imagem?: string;
  localizacao?: string;
  ativo: boolean;
  ultima_movimentacao?: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

export interface ScanResult {
  code: string;
  format: BarcodeFormat;
  timestamp: Date;
  confidence?: number;
  product?: ScannedProduct;
  found: boolean;
}

export interface ScanHistory {
  id: string;
  codigo: string;
  produto?: ScannedProduct;
  found: boolean;
  timestamp: Date;
  action_taken?: ScanAction;
  session_id: string;
  user_id: string;
  location?: GeolocationPosition;
}

export interface ScannerSettings {
  continuous_mode: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  torch_enabled: boolean;
  torch_auto: boolean;
  camera_device_id?: string;
  scan_delay: number;
  cache_duration: number;
  offline_mode: boolean;
  analytics_enabled: boolean;
  preferred_formats: BarcodeFormat[];
}

export interface CameraDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
  groupId?: string;
}

export interface ScannerState {
  isActive: boolean;
  isScanning: boolean;
  isLoading: boolean;
  hasPermission: boolean;
  error?: ScannerError;
  currentScan?: ScanResult;
  lastSuccessfulScan?: ScanResult;
  sessionStats: ScannerSessionStats;
}

export interface ScannerSessionStats {
  scans_attempted: number;
  scans_successful: number;
  products_found: number;
  unique_products: number;
  session_duration: number;
  average_scan_time: number;
  actions_taken: number;
}

export interface MovementRequest {
  produto_id: string;
  tipo_movimentacao: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  motivo?: string;
  observacoes?: string;
  batch_id?: string;
}

export interface BatchMovement {
  id: string;
  movements: MovementRequest[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: Date;
  processed_at?: Date;
  success_count: number;
  error_count: number;
  errors: BatchError[];
}

export interface BatchError {
  movement_index: number;
  product_id: string;
  error_code: string;
  error_message: string;
}

// =============================================================================
// ENUMS
// =============================================================================

export enum BarcodeFormat {
  CODE_128 = 'CODE_128',
  CODE_39 = 'CODE_39',
  CODE_93 = 'CODE_93',
  EAN_8 = 'EAN_8',
  EAN_13 = 'EAN_13',
  UPC_A = 'UPC_A',
  UPC_E = 'UPC_E',
  QR_CODE = 'QR_CODE',
  DATA_MATRIX = 'DATA_MATRIX',
  PDF_417 = 'PDF_417',
  AZTEC = 'AZTEC',
  CODABAR = 'CODABAR'
}

export enum ScanAction {
  VIEW = 'view',
  STOCK_IN = 'stock_in',
  STOCK_OUT = 'stock_out',
  STOCK_CHECK = 'stock_check',
  STOCK_ADJUST = 'stock_adjust',
  CREATE_PRODUCT = 'create_product',
  EDIT_PRODUCT = 'edit_product',
  LOCATION_UPDATE = 'location_update'
}

export enum ScannerError {
  CAMERA_NOT_FOUND = 'camera_not_found',
  CAMERA_PERMISSION_DENIED = 'camera_permission_denied',
  CAMERA_ACCESS_FAILED = 'camera_access_failed',
  DECODER_INITIALIZATION_FAILED = 'decoder_initialization_failed',
  SCAN_TIMEOUT = 'scan_timeout',
  PRODUCT_NOT_FOUND = 'product_not_found',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error'
}

// =============================================================================
// ADVANCED TYPES
// =============================================================================

export interface ScannerAnalytics {
  daily_scans: number;
  success_rate: number;
  popular_products: Array<{
    product_id: string;
    scan_count: number;
    last_scanned: Date;
  }>;
  performance_metrics: {
    average_scan_time: number;
    cache_hit_rate: number;
    error_rate: number;
  };
  usage_patterns: {
    peak_hours: number[];
    device_types: Record<string, number>;
    location_data?: Array<{
      latitude: number;
      longitude: number;
      scan_count: number;
    }>;
  };
}

export interface ScannerTemplate {
  id: string;
  name: string;
  description: string;
  actions: TemplateAction[];
  is_default: boolean;
  created_by: string;
  created_at: Date;
}

export interface TemplateAction {
  type: ScanAction;
  quantity?: number;
  reason?: string;
  auto_execute: boolean;
  confirmation_required: boolean;
}

export interface ScannerCache {
  products: Map<string, CachedProduct>;
  barcodes: Map<string, string>; // barcode -> product_id
  lastCleanup: Date;
  hitCount: number;
  missCount: number;
}

export interface CachedProduct {
  product: ScannedProduct;
  cached_at: Date;
  expires_at: Date;
  access_count: number;
  last_accessed: Date;
}

export interface ScannerConfig {
  max_cache_size: number;
  cache_ttl_minutes: number;
  max_scan_attempts: number;
  scan_timeout_ms: number;
  debounce_ms: number;
  batch_size: number;
  offline_sync_interval: number;
  analytics_batch_size: number;
}

// =============================================================================
// HOOK TYPES
// =============================================================================

export interface UseScannerCoreOptions {
  enableContinuousMode?: boolean;
  enableSound?: boolean;
  enableVibration?: boolean;
  cacheSettings?: Partial<ScannerConfig>;
  onScanSuccess?: (result: ScanResult) => void;
  onScanError?: (error: ScannerError) => void;
  onProductFound?: (product: ScannedProduct) => void;
  onProductNotFound?: (code: string) => void;
}

export interface UseScannerCameraOptions {
  preferredDeviceId?: string;
  constraints?: MediaTrackConstraints;
  enableTorch?: boolean;
  onPermissionChange?: (hasPermission: boolean) => void;
  onDeviceChange?: (devices: CameraDevice[]) => void;
}

export interface UseScannerSearchOptions {
  enableCache?: boolean;
  enableFuzzySearch?: boolean;
  cacheStrategy?: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  onCacheHit?: (product: ScannedProduct) => void;
  onCacheMiss?: (code: string) => void;
}

// =============================================================================
// SERVICE TYPES
// =============================================================================

export interface ProductLookupService {
  findByBarcode(code: string): Promise<ScannedProduct | null>;
  findBySku(sku: string): Promise<ScannedProduct | null>;
  findByName(name: string): Promise<ScannedProduct[]>;
  search(query: string, filters?: ProductSearchFilters): Promise<ScannedProduct[]>;
  createProduct(data: CreateProductData): Promise<ScannedProduct>;
  updateStock(productId: string, movement: MovementRequest): Promise<boolean>;
  batchUpdate(movements: MovementRequest[]): Promise<BatchMovement>;
}

export interface ProductSearchFilters {
  category?: string;
  price_range?: [number, number];
  stock_range?: [number, number];
  active_only?: boolean;
  location?: string;
}

export interface CreateProductData {
  sku_interno: string;
  nome: string;
  descricao?: string;
  codigo_barras?: string;
  categoria?: string;
  preco_custo?: number;
  preco_venda?: number;
  estoque_minimo?: number;
  estoque_maximo?: number;
  localizacao?: string;
}

// =============================================================================
// EXPORTS
// =============================================================================

export type ScannerHookResult = {
  state: ScannerState;
  settings: ScannerSettings;
  cache: ScannerCache;
  analytics: ScannerAnalytics;
  actions: {
    startScanning: () => Promise<void>;
    stopScanning: () => void;
    scanBarcode: (code: string) => Promise<ScanResult>;
    updateSettings: (settings: Partial<ScannerSettings>) => void;
    clearCache: () => void;
    exportData: () => Promise<Blob>;
    importData: (file: File) => Promise<void>;
  };
};