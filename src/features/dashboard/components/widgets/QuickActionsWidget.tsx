import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { AddShortcutModal } from '@/components/dashboard/AddShortcutModal';
import { X, Plus } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = 'dashboard-quick-shortcuts';

interface Service {
  name: string;
  imageUrl: string;
  href: string;
  gradient: string;
}

const DEFAULT_SHORTCUTS: Service[] = [
  {
    name: 'Pedidos',
    imageUrl: 'https://img.icons8.com/fluency/96/shopping-cart.png',
    href: '/pedidos',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-600'
  },
  {
    name: 'Estoque',
    imageUrl: 'https://img.icons8.com/fluency/96/warehouse.png',
    href: '/estoque',
    gradient: 'bg-gradient-to-br from-amber-500 to-orange-600'
  },
  {
    name: 'Vendas Online',
    imageUrl: 'https://img.icons8.com/fluency/96/online-store.png',
    href: '/vendas-online',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-600'
  },
  {
    name: 'Produtos',
    imageUrl: 'https://img.icons8.com/fluency/96/product.png',
    href: '/apps/ecommerce/list',
    gradient: 'bg-gradient-to-br from-green-500 to-emerald-600'
  },
  {
    name: 'Clientes',
    imageUrl: 'https://img.icons8.com/fluency/96/customer.png',
    href: '/oms/clientes',
    gradient: 'bg-gradient-to-br from-pink-500 to-rose-600'
  }
];

interface DockIconProps {
  item: Service;
  mouseX: any;
  onRemove: () => void;
  onClick: () => void;
}

function DockIcon({ item, mouseX, onRemove, onClick }: DockIconProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [69, 104, 69]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const heightSync = useTransform(distance, [-150, 0, 150], [69, 104, 69]);
  const height = useSpring(heightSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  return (
    <motion.div
      ref={ref}
      style={{ width, height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsClicked(true)}
      onMouseUp={() => setIsClicked(false)}
      onClick={onClick}
      className="aspect-square cursor-pointer flex items-center justify-center relative group"
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="w-full h-full relative"
        animate={{
          y: isClicked ? 2 : isHovered ? -8 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 17,
        }}
      >
        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-1 -right-1 z-10 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-destructive/90"
          aria-label="Remover atalho"
        >
          <X className="h-3 w-3" />
        </button>

        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-contain rounded-2xl"
        />
        
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl pointer-events-none"
          animate={{
            opacity: isHovered ? 0.3 : 0.1,
          }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 5, scale: 0.8 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          y: isHovered ? -15 : 5,
          scale: isHovered ? 1 : 0.8,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800/90 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none backdrop-blur-sm z-50"
      >
        {item.name}
      </motion.div>

      {/* Active indicator dot */}
      <motion.div
        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white/80 rounded-full"
        animate={{
          scale: isClicked ? 1.5 : 1,
          opacity: isClicked ? 1 : 0.7,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
      />
    </motion.div>
  );
}

function AddDockIcon({ mouseX, onClick }: { mouseX: any; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  
  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [69, 104, 69]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const heightSync = useTransform(distance, [-150, 0, 150], [69, 104, 69]);
  const height = useSpring(heightSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  return (
    <motion.div
      ref={ref}
      style={{ width, height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsClicked(true)}
      onMouseUp={() => setIsClicked(false)}
      onClick={onClick}
      className="aspect-square cursor-pointer flex items-center justify-center relative group"
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="w-full h-full rounded-2xl shadow-lg flex items-center justify-center text-muted-foreground relative overflow-hidden bg-muted/50 border-2 border-muted"
        animate={{
          y: isClicked ? 2 : isHovered ? -8 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 17,
        }}
      >
        <motion.div
          animate={{
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 17,
          }}
        >
          <Plus className="w-8 h-8" />
        </motion.div>
      </motion.div>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 5, scale: 0.8 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          y: isHovered ? -15 : 5,
          scale: isHovered ? 1 : 0.8,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800/90 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none backdrop-blur-sm z-50"
      >
        Adicionar
      </motion.div>
    </motion.div>
  );
}

export const QuickActionsWidget = () => {
  const [shortcuts, setShortcuts] = useState<Service[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('[QuickActionsWidget] Error loading shortcuts:', error);
    }
    return DEFAULT_SHORTCUTS;
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const mouseX = useMotionValue(Infinity);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
    } catch (error) {
      console.error('[QuickActionsWidget] Error saving shortcuts:', error);
    }
  }, [shortcuts]);

  const handleAddShortcut = (page: any) => {
    const newShortcut: Service = {
      name: page.label,
      imageUrl: page.icon?.props?.src || 'https://img.icons8.com/fluency/96/documents.png',
      href: page.route,
      gradient: page.gradient
    };
    setShortcuts([...shortcuts, newShortcut]);
  };

  const handleRemoveShortcut = (index: number) => {
    const newShortcuts = shortcuts.filter((_, i) => i !== index);
    setShortcuts(newShortcuts);
  };

  const existingIds = shortcuts.map((s) => {
    const route = s.href;
    return route.replace(/\//g, '-').substring(1);
  });

  return (
    <>
      <section className="w-full py-6">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-center">
          <motion.div
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className="flex h-24 items-end gap-4 rounded-3xl bg-card backdrop-blur-md px-6 pb-4 border-2 border-border shadow-xl"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1,
            }}
          >
            {shortcuts.map((service, index) => (
              <DockIcon
                key={index}
                item={service}
                mouseX={mouseX}
                onRemove={() => handleRemoveShortcut(index)}
                onClick={() => navigate(service.href)}
              />
            ))}
            
            <AddDockIcon
              mouseX={mouseX}
              onClick={() => setIsModalOpen(true)}
            />
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
