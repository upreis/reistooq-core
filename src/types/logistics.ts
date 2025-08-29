export interface LogisticEvent {
  id: string;
  title: string;
  description?: string;
  type: 'delivery' | 'pickup' | 'transport' | 'deadline' | 'meeting' | 'maintenance';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'delayed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  date: string;
  time?: string;
  duration?: number; // em minutos
  location?: string;
  customer?: string;
  tracking_code?: string;
  transport_company?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  reminder_sent?: boolean;
  notification_days_before?: number;
}

export interface CalendarViewMode {
  type: 'month' | 'week' | 'day' | 'agenda';
  label: string;
}

export interface CalendarFilters {
  types: LogisticEvent['type'][];
  statuses: LogisticEvent['status'][];
  priorities: LogisticEvent['priority'][];
  dateRange: {
    start?: Date;
    end?: Date;
  };
}

export interface CalendarMetrics {
  totalEvents: number;
  pendingDeliveries: number;
  scheduledPickups: number;
  criticalEvents: number;
  overdueEvents: number;
}