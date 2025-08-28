import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  GripVertical, 
  Package, 
  TrendingUp, 
  Users, 
  DollarSign,
  AlertTriangle,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";

interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'list' | 'alert';
  visible: boolean;
  data: any;
  size: 'small' | 'medium' | 'large';
}

interface SortableWidgetProps {
  widget: DashboardWidget;
  onToggleVisibility: (id: string) => void;
}

function SortableWidget({ widget, onToggleVisibility }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getWidgetIcon = (type: string) => {
    switch (type) {
      case 'metric': return <DollarSign className="w-5 h-5" />;
      case 'chart': return <TrendingUp className="w-5 h-5" />;
      case 'list': return <Package className="w-5 h-5" />;
      case 'alert': return <AlertTriangle className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const getWidgetSize = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-2';
      case 'large': return 'col-span-3';
      default: return 'col-span-1';
    }
  };

  if (!widget.visible) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${getWidgetSize(widget.size)} transition-all duration-200`}
      {...attributes}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center">
              {getWidgetIcon(widget.type)}
              <span className="ml-2">{widget.title}</span>
            </CardTitle>
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggleVisibility(widget.id)}
                className="h-6 w-6 p-0"
              >
                <Eye className="w-3 h-3" />
              </Button>
              <div
                {...listeners}
                className="cursor-move p-1 hover:bg-muted rounded"
              >
                <GripVertical className="w-3 h-3 text-muted-foreground" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {widget.type === 'metric' && (
            <div>
              <p className="text-2xl font-bold">{widget.data.value}</p>
              <p className="text-sm text-muted-foreground">{widget.data.description}</p>
              {widget.data.change && (
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                  <span className="text-sm text-green-500">{widget.data.change}</span>
                </div>
              )}
            </div>
          )}
          
          {widget.type === 'alert' && (
            <div className="space-y-2">
              {widget.data.alerts.map((alert: any, index: number) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm">{alert.message}</span>
                </div>
              ))}
            </div>
          )}
          
          {widget.type === 'list' && (
            <div className="space-y-2">
              {widget.data.items.slice(0, 3).map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span>{item.name}</span>
                  <Badge variant="outline">{item.value}</Badge>
                </div>
              ))}
            </div>
          )}
          
          {widget.type === 'chart' && (
            <div className="h-20 bg-gradient-to-r from-primary/10 to-primary/5 rounded flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function OMSDragDropDashboard() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([
    {
      id: '1',
      title: 'Receita Total',
      type: 'metric',
      visible: true,
      size: 'small',
      data: {
        value: 'R$ 145.2k',
        description: 'Este mês',
        change: '+12.5%'
      }
    },
    {
      id: '2',
      title: 'Produtos Críticos',
      type: 'alert',
      visible: true,
      size: 'medium',
      data: {
        alerts: [
          { message: 'iPhone 15 Pro - Estoque baixo (5 unidades)' },
          { message: 'MacBook Air - Reposição urgente' }
        ]
      }
    },
    {
      id: '3',
      title: 'Top Produtos',
      type: 'list',
      visible: true,
      size: 'small',
      data: {
        items: [
          { name: 'iPhone 15', value: '45 vendas' },
          { name: 'Samsung S24', value: '32 vendas' },
          { name: 'iPad Pro', value: '28 vendas' }
        ]
      }
    },
    {
      id: '4',
      title: 'Vendas Mensais',
      type: 'chart',
      visible: true,
      size: 'medium',
      data: {}
    },
    {
      id: '5',
      title: 'Novos Clientes',
      type: 'metric',
      visible: true,
      size: 'small',
      data: {
        value: '89',
        description: 'Este mês',
        change: '+25.8%'
      }
    },
    {
      id: '6',
      title: 'Margem Bruta',
      type: 'metric',
      visible: false,
      size: 'small',
      data: {
        value: 'R$ 52.3k',
        description: 'Este mês',
        change: '+8.2%'
      }
    }
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleWidgetVisibility = (id: string) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === id 
        ? { ...widget, visible: !widget.visible }
        : widget
    ));
  };

  const visibleWidgets = widgets.filter(w => w.visible);
  const hiddenWidgets = widgets.filter(w => !w.visible);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Dashboard Personalizado</h2>
          <p className="text-muted-foreground">
            Arraste e reorganize os widgets conforme sua preferência
          </p>
        </div>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Configurar Widgets
        </Button>
      </div>

      {/* Drag & Drop Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={visibleWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleWidgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                onToggleVisibility={toggleWidgetVisibility}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Hidden Widgets */}
      {hiddenWidgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Widgets Ocultos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {hiddenWidgets.map((widget) => (
                <Button
                  key={widget.id}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleWidgetVisibility(widget.id)}
                  className="h-8"
                >
                  <EyeOff className="w-3 h-3 mr-2" />
                  {widget.title}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}