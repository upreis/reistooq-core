// 🕒 Gerenciador de Horários de Acesso

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AuthEnterpriseService, AccessSchedule } from '@/services/AuthEnterpriseService';
import { useRoles, useUsers } from '@/features/admin/hooks/useAdmin';
import { Clock, Plus, Edit2, Trash2, Users, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' }
];

interface ScheduleFormProps {
  schedule?: AccessSchedule;
  onSave: (schedule: AccessSchedule) => void;
  onCancel: () => void;
}

function ScheduleForm({ schedule, onSave, onCancel }: ScheduleFormProps) {
  const { roles } = useRoles();
  const { users } = useUsers();
  
  const [formData, setFormData] = useState<AccessSchedule>({
    day_of_week: schedule?.day_of_week || 1,
    start_time: schedule?.start_time || '08:00',
    end_time: schedule?.end_time || '18:00',
    user_id: schedule?.user_id || '',
    role_id: schedule?.role_id || '',
    is_active: schedule?.is_active ?? true
  });

  const [targetType, setTargetType] = useState<'user' | 'role'>(
    schedule?.user_id ? 'user' : 'role'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const scheduleData: AccessSchedule = {
      ...formData,
      id: schedule?.id,
      user_id: targetType === 'user' ? formData.user_id : undefined,
      role_id: targetType === 'role' ? formData.role_id : undefined
    };

    onSave(scheduleData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          {schedule ? 'Editar Horário' : 'Novo Horário'}
        </CardTitle>
        <CardDescription>
          Configure horários de acesso para usuários ou cargos
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Alvo */}
          <div className="space-y-2">
            <Label>Aplicar para</Label>
            <Select value={targetType} onValueChange={(value: 'user' | 'role') => setTargetType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Usuário específico
                  </div>
                </SelectItem>
                <SelectItem value="role">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Cargo/função
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seleção de Usuário ou Cargo */}
          {targetType === 'user' ? (
            <div className="space-y-2">
              <Label htmlFor="user">Usuário</Label>
              <Select value={formData.user_id} onValueChange={(value) => setFormData(prev => ({ ...prev, user_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.nome_completo || user.nome_exibicao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="role">Cargo</Label>
              <Select value={formData.role_id} onValueChange={(value) => setFormData(prev => ({ ...prev, role_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Dia da Semana */}
          <div className="space-y-2">
            <Label htmlFor="day">Dia da semana</Label>
            <Select value={formData.day_of_week.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, day_of_week: parseInt(value) }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map(day => (
                  <SelectItem key={day.value} value={day.value.toString()}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Hora início</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end_time">Hora fim</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Ativo */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Ativo</Label>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button type="submit">
              {schedule ? 'Atualizar' : 'Criar'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function AccessScheduleManager() {
  const [schedules, setSchedules] = useState<AccessSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<AccessSchedule | undefined>();

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const data = await AuthEnterpriseService.getAccessSchedules();
      setSchedules(data);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast.error('Erro ao carregar horários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const handleSave = async (schedule: AccessSchedule) => {
    try {
      const result = await AuthEnterpriseService.saveAccessSchedule(schedule);
      if (result.success) {
        toast.success('Horário salvo com sucesso');
        setShowForm(false);
        setEditingSchedule(undefined);
        loadSchedules();
      } else {
        toast.error('Erro ao salvar horário');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar horário');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await AuthEnterpriseService.deleteAccessSchedule(id);
      if (success) {
        toast.success('Horário excluído com sucesso');
        loadSchedules();
      } else {
        toast.error('Erro ao excluir horário');
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir horário');
    }
  };

  const getDayName = (dayNumber: number) => {
    return DAYS_OF_WEEK.find(day => day.value === dayNumber)?.label || 'Desconhecido';
  };

  if (showForm) {
    return (
      <ScheduleForm
        schedule={editingSchedule}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingSchedule(undefined);
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Horários de Acesso
            </CardTitle>
            <CardDescription>
              Configure quando usuários podem acessar o sistema
            </CardDescription>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Horário
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando horários...</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum horário configurado</h3>
            <p className="text-muted-foreground mb-4">
              Configure horários de acesso para controlar quando usuários podem usar o sistema
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar primeiro horário
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map(schedule => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={schedule.is_active ? "default" : "secondary"}>
                      {getDayName(schedule.day_of_week)}
                    </Badge>
                    <span className="font-medium">
                      {schedule.start_time} - {schedule.end_time}
                    </span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {schedule.user_id ? (
                      <div className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        Usuário específico
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Cargo/função
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingSchedule(schedule);
                      setShowForm(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir horário</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este horário de acesso? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => schedule.id && handleDelete(schedule.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}