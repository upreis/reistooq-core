import { OrderAdvanced, OrderFiltersState } from './orders-advanced.types';

// ===== EXPORT SYSTEM TYPES =====
export interface ExportConfig {
  id: string;
  name: string;
  description: string;
  format: ExportFormat;
  fields: ExportField[];
  filters: OrderFiltersState;
  template: ExportTemplate | null;
  schedule: ExportSchedule | null;
  created_at: string;
  updated_at: string;
}

export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json' | 'xml';

export interface ExportField {
  key: keyof OrderAdvanced;
  label: string;
  format?: FieldFormat;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export interface FieldFormat {
  type: 'currency' | 'date' | 'percentage' | 'number' | 'text';
  options?: Record<string, any>;
}

export interface ExportTemplate {
  id: string;
  name: string;
  header: ExportHeaderConfig;
  body: ExportBodyConfig;
  footer: ExportFooterConfig;
  styles: ExportStyles;
}

export interface ExportHeaderConfig {
  show_logo: boolean;
  logo_url?: string;
  title: string;
  subtitle?: string;
  show_date: boolean;
  show_filters: boolean;
}

export interface ExportBodyConfig {
  grouping?: {
    field: keyof OrderAdvanced;
    show_subtotals: boolean;
  };
  sorting: {
    field: keyof OrderAdvanced;
    direction: 'asc' | 'desc';
  }[];
}

export interface ExportFooterConfig {
  show_summary: boolean;
  show_totals: boolean;
  custom_text?: string;
}

export interface ExportStyles {
  font_family: string;
  font_size: number;
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
  };
}

// ===== EXPORT SCHEDULING =====
export interface ExportSchedule {
  id: string;
  frequency: ExportFrequency;
  time: string; // HH:mm format
  timezone: string;
  recipients: string[];
  is_active: boolean;
  next_run: string;
  last_run: string | null;
}

export type ExportFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';

// ===== EXPORT JOB =====
export interface ExportJob {
  id: string;
  config_id: string;
  status: ExportJobStatus;
  progress: number;
  file_url: string | null;
  file_size: number | null;
  total_records: number;
  processed_records: number;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
}

export type ExportJobStatus = 
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired';

// ===== EXPORT RESULT =====
export interface ExportResult {
  success: boolean;
  job_id?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  total_records?: number;
  error?: string;
  estimated_time?: number; // seconds
}

// ===== EXPORT LIMITS =====
export interface ExportLimits {
  max_records_sync: number;
  max_records_async: number;
  max_file_size: number; // bytes
  allowed_formats: ExportFormat[];
  rate_limit: {
    requests_per_hour: number;
    requests_per_day: number;
  };
}

export const DEFAULT_EXPORT_LIMITS: ExportLimits = {
  max_records_sync: 5000,
  max_records_async: 100000,
  max_file_size: 50 * 1024 * 1024, // 50MB
  allowed_formats: ['csv', 'xlsx', 'pdf'],
  rate_limit: {
    requests_per_hour: 10,
    requests_per_day: 50,
  },
};