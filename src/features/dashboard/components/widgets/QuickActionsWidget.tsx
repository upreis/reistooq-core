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

          {/* Animated Grid Section */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {shortcuts.map((service, index) => (
              <motion.div
                key={index}
                className="group relative flex flex-col items-center justify-start gap-3 text-center"
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveShortcut(index);
                  }}
                  className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Service card */}
                <button
                  onClick={() => navigate(service.href)}
                  className="flex flex-col items-center justify-start gap-3 text-center w-full"
                >
                  <div className="flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28">
                    <img
                      src={service.imageUrl}
                      alt={`${service.name} service icon`}
                      width={100}
                      height={100}
                      className="object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground transition-colors duration-300 group-hover:text-primary">
                    {service.name}
                  </span>
                </button>
              </motion.div>
            ))}

            {/* Add button */}
            <motion.button
              onClick={() => setIsModalOpen(true)}
              className="group flex flex-col items-center justify-start gap-3 text-center"
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <div className="flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28">
                <img
                  src="https://img.icons8.com/fluency/96/plus-math.png"
                  alt="Adicionar atalho"
                  width={100}
                  height={100}
                  className="object-contain transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <span className="text-sm font-medium text-foreground transition-colors duration-300 group-hover:text-primary">
                Adicionar
              </span>
            </motion.button>
          </motion.div>
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