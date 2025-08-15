// Types para sistema de exportação avançado
export interface HistoricoExportFormat {
  id: string;
  name: string;
  description: string;
  extensions: string[];
  mimeType: string;
  icon: string;
  maxRecords?: number;
  supportsCharts: boolean;
  supportsFormatting: boolean;
  supportsFormulas: boolean;
  fileSize: 'small' | 'medium' | 'large';
  processingTime: 'fast' | 'medium' | 'slow';
}

export interface HistoricoExportTemplate {
  id: string;
  name: string;
  description?: string;
  format: string;
  columns: Array<{
    field: string;
    header: string;
    width?: number;
    format?: string;
    formula?: string;
    conditional?: {
      condition: string;
      format: any;
    }[];
  }>;
  styles?: {
    headerStyle?: any;
    dataStyle?: any;
    alternateRowColor?: boolean;
    borders?: boolean;
    fontSize?: number;
    fontFamily?: string;
  };
  charts?: Array<{
    type: 'bar' | 'line' | 'pie' | 'scatter';
    title: string;
    xAxis: string;
    yAxis: string;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
  }>;
  summary?: {
    includeStats: boolean;
    includeTotals: boolean;
    includeAverages: boolean;
    customCalculations?: Array<{
      name: string;
      formula: string;
    }>;
  };
  metadata?: {
    includeFilters: boolean;
    includeExportInfo: boolean;
    includeUserInfo: boolean;
    customFields?: Record<string, any>;
  };
  isDefault: boolean;
  userId?: string;
  shared: boolean;
  tags?: string[];
}

export interface HistoricoExportOptions {
  format: string;
  template?: string;
  includeHeaders: boolean;
  includeFilters: boolean;
  includeMetadata: boolean;
  compression?: 'none' | 'zip' | 'gzip';
  password?: string;
  dateFormat?: string;
  numberFormat?: string;
  encoding?: 'utf8' | 'latin1' | 'ascii';
  delimiter?: string; // Para CSV
  batchSize?: number;
  maxRecords?: number;
  backgroundProcessing: boolean;
  emailWhenReady?: boolean;
  customFilename?: string;
  watermark?: {
    text: string;
    opacity: number;
    position: 'header' | 'footer' | 'center';
  };
}

export interface HistoricoExportJob {
  id: string;
  userId: string;
  type: 'immediate' | 'background' | 'scheduled';
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  format: string;
  template?: string;
  options: HistoricoExportOptions;
  filters: any;
  totalRecords: number;
  processedRecords: number;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  estimatedTimeRemaining?: number;
  fileSize?: number;
  downloadUrl?: string;
  downloadExpires?: Date;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  retryCount: number;
  priority: 'low' | 'normal' | 'high';
  metadata?: Record<string, any>;
}

export interface HistoricoExportSchedule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  cronExpression?: string;
  timezone: string;
  nextRun: Date;
  lastRun?: Date;
  options: HistoricoExportOptions;
  filters: any;
  emailTo: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  runHistory: Array<{
    id: string;
    startedAt: Date;
    completedAt?: Date;
    status: 'success' | 'failed';
    recordCount?: number;
    fileSize?: number;
    error?: string;
  }>;
}

export interface HistoricoExportValidation {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    field: string;
    message: string;
    suggestion?: string;
  }>;
  estimatedSize: number;
  estimatedTime: number;
  recordCount: number;
}

export interface HistoricoExportStatistics {
  totalExports: number;
  totalRecordsExported: number;
  totalFileSize: number;
  mostUsedFormat: string;
  averageExportTime: number;
  popularTemplates: Array<{
    id: string;
    name: string;
    usageCount: number;
  }>;
  recentJobs: HistoricoExportJob[];
  scheduledJobs: HistoricoExportSchedule[];
  storageUsed: number;
  storageLimit: number;
}