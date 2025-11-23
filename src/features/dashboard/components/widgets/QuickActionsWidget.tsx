import React, { useState, useEffect } from 'react';
import { ServiceGrid, Service } from '@/components/ui/service-grid';
import { AddShortcutModal } from '@/components/dashboard/AddShortcutModal';
import pedidosIcon from '@/assets/pedidos-cart-icon.png';
import estoqueIcon from '@/assets/estoque-icon.png';

const STORAGE_KEY = 'dashboard-quick-shortcuts';

const DEFAULT_SHORTCUTS: Service[] = [
  {
    name: 'Pedidos',
    imageUrl: pedidosIcon,
    href: '/pedidos'
  },
  {
    name: 'Estoque',
    imageUrl: estoqueIcon,
    href: '/estoque'
  },
  {
    name: 'Vendas Online',
    imageUrl: 'https://img.icons8.com/fluency/96/online-store.png',
    href: '/vendas-online'
  },
  {
    name: 'Produtos',
    imageUrl: 'https://img.icons8.com/fluency/96/package.png',
    href: '/apps/ecommerce/list'
  },
  {
    name: 'Clientes',
    imageUrl: 'https://img.icons8.com/fluency/96/conference-call.png',
    href: '/oms/clientes'
  }
];

export const QuickActionsWidget = () => {
  const [shortcuts, setShortcuts] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Carregar atalhos do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      console.log('[QuickActionsWidget] Loaded from localStorage:', { key: STORAGE_KEY, raw: saved });

      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('[QuickActionsWidget] Parsed shortcuts:', parsed);
        setShortcuts(parsed);
      } else {
        console.log('[QuickActionsWidget] No saved shortcuts found, using defaults');
        setShortcuts(DEFAULT_SHORTCUTS);
      }
    } catch (error) {
      console.error('[QuickActionsWidget] Error loading shortcuts, falling back to defaults', error);
      setShortcuts(DEFAULT_SHORTCUTS);
    }
  }, []);

  // Salvar atalhos no localStorage
  useEffect(() => {
    try {
      console.log('[QuickActionsWidget] Saving shortcuts to localStorage:', shortcuts);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
    } catch (error) {
      console.error('[QuickActionsWidget] Error saving shortcuts to localStorage', error);
    }
  }, [shortcuts]);

  const handleAddShortcut = (page: any) => {
    // Verificar se o ícone é uma imagem
    let imageUrl = 'https://img.icons8.com/fluency/96/documents.png';
    
    if (page.icon?.props?.src) {
      imageUrl = page.icon.props.src;
    } else {
      // Mapear ícones para URLs de imagens do icons8
      const iconMap: Record<string, string> = {
        'home': 'https://img.icons8.com/fluency/96/home.png',
        'trending-up': 'https://img.icons8.com/fluency/96/graph.png',
        'package': 'https://img.icons8.com/fluency/96/package.png',
        'pie-chart': 'https://img.icons8.com/fluency/96/pie-chart.png',
        'shopping-cart': 'https://img.icons8.com/fluency/96/shopping-cart.png',
        'clipboard-list': 'https://img.icons8.com/fluency/96/todo-list.png',
        'users': 'https://img.icons8.com/fluency/96/conference-call.png',
        'settings': 'https://img.icons8.com/fluency/96/settings.png',
        'layers': 'https://img.icons8.com/fluency/96/layers.png',
        'history': 'https://img.icons8.com/fluency/96/clock.png',
        'alert-circle': 'https://img.icons8.com/fluency/96/error.png',
        'truck': 'https://img.icons8.com/fluency/96/truck.png',
        'file-text': 'https://img.icons8.com/fluency/96/documents.png',
        'upload': 'https://img.icons8.com/fluency/96/upload.png',
        'calendar': 'https://img.icons8.com/fluency/96/calendar.png',
        'sticky-note': 'https://img.icons8.com/fluency/96/note.png',
        'store': 'https://img.icons8.com/fluency/96/online-store.png',
        'list': 'https://img.icons8.com/fluency/96/list.png',
        'plus': 'https://img.icons8.com/fluency/96/plus-math.png',
        'link': 'https://img.icons8.com/fluency/96/link.png',
        'message-square': 'https://img.icons8.com/fluency/96/chat.png',
        'shield': 'https://img.icons8.com/fluency/96/shield.png',
        'bell': 'https://img.icons8.com/fluency/96/bell.png',
        'scan': 'https://img.icons8.com/fluency/96/barcode-scanner.png',
        'arrow-left-right': 'https://img.icons8.com/fluency/96/sort.png',
      };

      // Tentar encontrar um match baseado no nome da página
      const lowercaseLabel = page.label.toLowerCase();
      for (const [key, url] of Object.entries(iconMap)) {
        if (lowercaseLabel.includes(key.replace('-', ' '))) {
          imageUrl = url;
          break;
        }
      }
    }

    const newShortcut: Service = {
      name: page.label,
      imageUrl: imageUrl,
      href: page.route
    };
    setShortcuts([...shortcuts, newShortcut]);
  };

  const handleServiceClick = (href: string) => {
    if (href === '#add') {
      setIsModalOpen(true);
    }
  };

  const existingIds = shortcuts.map((s) => {
    const route = s.href;
    // Converter route de volta para id
    return route.replace(/\//g, '-').substring(1);
  });

  // Adicionar botão "Adicionar" aos serviços
  const servicesWithAdd: Service[] = [
    ...shortcuts,
    {
      name: 'Adicionar',
      imageUrl: 'https://img.icons8.com/fluency/96/plus-math.png',
      href: '#add'
    }
  ];

  return (
    <>
      <div onClick={(e) => {
        const target = e.target as HTMLElement;
        const button = target.closest('button');
        if (button) {
          const service = servicesWithAdd.find((s) => 
            button.textContent?.includes(s.name)
          );
          if (service?.href === '#add') {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }
      }}>
        <ServiceGrid
          title="Acesso Rápido"
          subtitle="Acesse rapidamente suas páginas favoritas"
          services={servicesWithAdd}
          className="py-0"
        />
      </div>

      <AddShortcutModal
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) setIsModalOpen(false);
        }}
        onAddShortcut={handleAddShortcut}
        existingShortcutIds={existingIds}
      />
    </>
  );
};