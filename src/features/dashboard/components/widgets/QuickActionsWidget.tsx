import React, { useState, useEffect } from 'react';
import { Service } from '@/components/ui/service-grid';
import { AddShortcutModal } from '@/components/dashboard/AddShortcutModal';
import pedidosIcon from '@/assets/pedidos-cart-icon.png';
import estoqueIcon from '@/assets/estoque-icon.png';
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

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
  // Inicializar com dados do localStorage ou defaults
  const [shortcuts, setShortcuts] = useState<Service[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      console.log('[QuickActionsWidget INIT] Loading from localStorage:', { key: STORAGE_KEY, raw: saved });
      
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('[QuickActionsWidget INIT] Loaded shortcuts:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('[QuickActionsWidget INIT] Error loading shortcuts:', error);
    }
    
    console.log('[QuickActionsWidget INIT] Using defaults');
    return DEFAULT_SHORTCUTS;
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Salvar atalhos no localStorage sempre que mudarem
  useEffect(() => {
    try {
      console.log('[QuickActionsWidget SAVE] Saving shortcuts to localStorage:', shortcuts);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
      console.log('[QuickActionsWidget SAVE] Successfully saved');
      
      // Verificar o que foi salvo
      const verification = localStorage.getItem(STORAGE_KEY);
      console.log('[QuickActionsWidget SAVE] Verification read back:', verification);
    } catch (error) {
      console.error('[QuickActionsWidget SAVE] Error saving shortcuts:', error);
    }
  }, [shortcuts]);

  const navigate = useNavigate();

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

  const handleRemoveShortcut = (index: number) => {
    console.log('[QuickActionsWidget] Removing shortcut at index:', index);
    console.log('[QuickActionsWidget] Current shortcuts:', shortcuts);
    const newShortcuts = shortcuts.filter((_, i) => i !== index);
    console.log('[QuickActionsWidget] New shortcuts after removal:', newShortcuts);
    setShortcuts(newShortcuts);
  };

  const existingIds = shortcuts.map((s) => {
    const route = s.href;
    // Converter route de volta para id
    return route.replace(/\//g, '-').substring(1);
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <>
      <section className="w-full py-0">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header Section */}
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-8 md:mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">
                Acesso Rápido
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Acesse rapidamente suas páginas favoritas
              </p>
            </div>
          </div>

          {/* Grid Section */}
          <div className="flex flex-wrap gap-x-2 gap-y-[1.5px]">
            {shortcuts.map((service, index) => (
              <button
                key={index}
                onClick={() => navigate(service.href)}
                className="group relative flex flex-col items-center gap-2 transition-transform duration-300 ease-in-out hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={`Ir para ${service.name}`}
              >
                {/* Card Icon */}
                <div className="relative h-24 w-24 rounded-2xl transition-all duration-300 shadow-md group-hover:shadow-xl group-hover:shadow-primary/20 bg-gradient-to-br from-primary to-primary/70">
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveShortcut(index);
                    }}
                    className="absolute -top-1 -right-1 z-10 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-destructive/90"
                    aria-label="Remover atalho"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <img
                      src={service.imageUrl}
                      alt={`${service.name} icon`}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                </div>
                
                {/* Label */}
                <p className="text-sm font-medium text-foreground text-center transition-colors group-hover:text-primary">
                  {service.name}
                </p>
              </button>
            ))}

            {/* Add button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="group relative flex flex-col items-center gap-2 transition-transform duration-300 ease-in-out hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Adicionar novo atalho"
            >
              {/* Add Card Icon */}
              <div className="relative h-24 w-24 rounded-2xl transition-all duration-300 shadow-md group-hover:shadow-xl group-hover:shadow-muted/20 bg-muted/50 border-2 border-dashed border-muted-foreground/30 group-hover:border-muted-foreground/50">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <img
                    src="https://img.icons8.com/fluency/96/plus-math.png"
                    alt="Adicionar"
                    className="w-8 h-8 object-contain"
                  />
                </div>
              </div>
              
              {/* Label */}
              <p className="text-sm font-medium text-muted-foreground text-center transition-colors group-hover:text-foreground">
                Adicionar
              </p>
            </button>
          </div>
        </div>
      </section>

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