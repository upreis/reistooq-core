import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Clock, MapPin, User, Package as PackageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LogisticEvent } from '@/types/logistics';
import { cn } from '@/lib/utils';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<LogisticEvent, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdate: (id: string, updates: Partial<LogisticEvent>) => void;
  onDelete?: (id: string) => void;
  event?: LogisticEvent;
  initialDate?: Date;
}

const EVENT_TYPES = [
  { value: 'delivery', label: 'Entrega', icon: '🚚' },
  { value: 'pickup', label: 'Coleta', icon: '📦' },
  { value: 'transport', label: 'Transporte', icon: '🚛' },
  { value: 'deadline', label: 'Prazo', icon: '⏰' },
  { value: 'meeting', label: 'Reunião', icon: '👥' },
  { value: 'maintenance', label: 'Manutenção', icon: '🔧' }
];

const EVENT_STATUS = [
  { value: 'scheduled', label: 'Agendado', color: 'text-blue-600' },
  { value: 'confirmed', label: 'Confirmado', color: 'text-green-600' },
  { value: 'in_progress', label: 'Em Andamento', color: 'text-yellow-600' },
  { value: 'completed', label: 'Concluído', color: 'text-green-700' },
  { value: 'cancelled', label: 'Cancelado', color: 'text-red-600' },
  { value: 'delayed', label: 'Atrasado', color: 'text-red-700' }
];

const EVENT_PRIORITIES = [
  { value: 'low', label: 'Baixa', color: 'text-green-600' },
  { value: 'medium', label: 'Média', color: 'text-yellow-600' },
  { value: 'high', label: 'Alta', color: 'text-orange-600' },
  { value: 'critical', label: 'Crítica', color: 'text-red-600' }
];

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  event,
  initialDate
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'delivery' as LogisticEvent['type'],
    status: 'scheduled' as LogisticEvent['status'],
    priority: 'medium' as LogisticEvent['priority'],
    date: '',
    time: '',
    duration: 60,
    location: '',
    customer: '',
    tracking_code: '',
    transport_company: '',
    notes: '',
    notification_days_before: 1
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Preencher formulário com dados do evento (edição) ou data inicial
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        type: event.type,
        status: event.status,
        priority: event.priority,
        date: event.date,
        time: event.time || '',
        duration: event.duration || 60,
        location: event.location || '',
        customer: event.customer || '',
        tracking_code: event.tracking_code || '',
        transport_company: event.transport_company || '',
        notes: event.notes || '',
        notification_days_before: event.notification_days_before || 1
      });
      setSelectedDate(new Date(event.date));
    } else if (initialDate) {
      const dateStr = format(initialDate, 'yyyy-MM-dd');
      setFormData(prev => ({ ...prev, date: dateStr }));
      setSelectedDate(initialDate);
    } else {
      // Reset para novo evento
      setFormData({
        title: '',
        description: '',
        type: 'delivery',
        status: 'scheduled',
        priority: 'medium',
        date: '',
        time: '',
        duration: 60,
        location: '',
        customer: '',
        tracking_code: '',
        transport_company: '',
        notes: '',
        notification_days_before: 1
      });
      setSelectedDate(undefined);
    }
    setErrors({});
  }, [event, initialDate, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }

    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    }

    if (formData.type === 'delivery' && !formData.customer.trim()) {
      newErrors.customer = 'Cliente é obrigatório para entregas';
    }

    if (formData.type === 'pickup' && !formData.location.trim()) {
      newErrors.location = 'Local é obrigatório para coletas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const eventData = {
      ...formData,
      date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : formData.date
    };

    if (event) {
      onUpdate(event.id, eventData);
    } else {
      onSave(eventData);
    }

    onClose();
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setFormData(prev => ({ ...prev, date: format(date, 'yyyy-MM-dd') }));
    }
  };

  const isEditing = !!event;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Evento' : 'Novo Evento Logístico'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Título */}
          <div className="md:col-span-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Entrega Cliente VIP"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Tipo */}
          <div>
            <Label htmlFor="type">Tipo *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: LogisticEvent['type']) => 
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center space-x-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: LogisticEvent['status']) => 
                setFormData(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_STATUS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <span className={status.color}>{status.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prioridade */}
          <div>
            <Label htmlFor="priority">Prioridade</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: LogisticEvent['priority']) => 
                setFormData(prev => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_PRIORITIES.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    <span className={priority.color}>{priority.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
          <div>
            <Label htmlFor="date">Data *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                    errors.date && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date}</p>}
          </div>

          {/* Horário */}
          <div>
            <Label htmlFor="time">Horário</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          {/* Duração */}
          <div>
            <Label htmlFor="duration">Duração (minutos)</Label>
            <Input
              id="duration"
              type="number"
              min="15"
              step="15"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
            />
          </div>

          {/* Local */}
          <div>
            <Label htmlFor="location">Local</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ex: São Paulo, SP"
                className={cn("pl-10", errors.location && "border-red-500")}
              />
            </div>
            {errors.location && <p className="text-sm text-red-500 mt-1">{errors.location}</p>}
          </div>

          {/* Cliente */}
          <div>
            <Label htmlFor="customer">Cliente</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="customer"
                value={formData.customer}
                onChange={(e) => setFormData(prev => ({ ...prev, customer: e.target.value }))}
                placeholder="Nome do cliente"
                className={cn("pl-10", errors.customer && "border-red-500")}
              />
            </div>
            {errors.customer && <p className="text-sm text-red-500 mt-1">{errors.customer}</p>}
          </div>

          {/* Código de rastreamento */}
          <div>
            <Label htmlFor="tracking_code">Código de Rastreamento</Label>
            <div className="relative">
              <PackageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="tracking_code"
                value={formData.tracking_code}
                onChange={(e) => setFormData(prev => ({ ...prev, tracking_code: e.target.value }))}
                placeholder="Ex: BR123456789"
                className="pl-10"
              />
            </div>
          </div>

          {/* Transportadora */}
          <div>
            <Label htmlFor="transport_company">Transportadora</Label>
            <Input
              id="transport_company"
              value={formData.transport_company}
              onChange={(e) => setFormData(prev => ({ ...prev, transport_company: e.target.value }))}
              placeholder="Nome da transportadora"
            />
          </div>

          {/* Notificação */}
          <div>
            <Label htmlFor="notification_days_before">Lembrete (dias antes)</Label>
            <Select
              value={formData.notification_days_before.toString()}
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, notification_days_before: parseInt(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No dia</SelectItem>
                <SelectItem value="1">1 dia antes</SelectItem>
                <SelectItem value="2">2 dias antes</SelectItem>
                <SelectItem value="3">3 dias antes</SelectItem>
                <SelectItem value="7">1 semana antes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="md:col-span-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detalhes adicionais sobre o evento..."
              rows={3}
            />
          </div>

          {/* Notas */}
          <div className="md:col-span-2">
            <Label htmlFor="notes">Notas Internas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações internas, instruções especiais..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {isEditing && onDelete && (
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(event.id);
                  onClose();
                }}
              >
                Excluir
              </Button>
            )}
          </div>
          
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? 'Atualizar' : 'Criar'} Evento
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};