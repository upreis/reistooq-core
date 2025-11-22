import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Settings,
  BarChart3,
  FileText,
  Users,
  Store,
  Truck,
  DollarSign,
  Box,
  ClipboardList,
  MessageSquare,
  Bell,
  Calendar,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PageOption {
  id: string;
  label: string;
  route: string;
  icon: React.ReactNode;
  category: string;
  gradient: string;
}

interface AddShortcutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddShortcut: (shortcut: PageOption) => void;
  existingShortcutIds: string[];
}

const ALL_PAGES: PageOption[] = [
  // Vendas & Pedidos
  {
    id: 'pedidos',
    label: 'Pedidos',
    route: '/pedidos',
    icon: <ShoppingCart />,
    category: 'Vendas & Pedidos',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-700'
  },
  {
    id: 'vendas-online',
    label: 'Vendas Online',
    route: '/vendas-online',
    icon: <TrendingUp />,
    category: 'Vendas & Pedidos',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-700'
  },
  {
    id: 'oms',
    label: 'OMS',
    route: '/oms',
    icon: <ClipboardList />,
    category: 'Vendas & Pedidos',
    gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-700'
  },
  
  // Estoque
  {
    id: 'estoque',
    label: 'Estoque',
    route: '/estoque',
    icon: <Package />,
    category: 'Estoque',
    gradient: 'bg-gradient-to-br from-green-500 to-green-700'
  },
  {
    id: 'estoquelocal',
    label: 'Estoque Local',
    route: '/estoquelocal',
    icon: <Box />,
    category: 'Estoque',
    gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700'
  },
  
  // Devoluções & Reclamações
  {
    id: 'devolucoesdevenda',
    label: 'Devoluções',
    route: '/devolucoesdevenda',
    icon: <TrendingDown />,
    category: 'Devoluções & Reclamações',
    gradient: 'bg-gradient-to-br from-orange-500 to-orange-700'
  },
  {
    id: 'devolucoes-ml',
    label: 'Devoluções ML',
    route: '/devolucoes-ml',
    icon: <TrendingDown />,
    category: 'Devoluções & Reclamações',
    gradient: 'bg-gradient-to-br from-amber-500 to-amber-700'
  },
  {
    id: 'reclamacoes',
    label: 'Reclamações',
    route: '/reclamacoes',
    icon: <AlertCircle />,
    category: 'Devoluções & Reclamações',
    gradient: 'bg-gradient-to-br from-red-500 to-red-700'
  },
  
  // Dashboard & Analytics
  {
    id: 'dashboardinicial',
    label: 'Dashboard',
    route: '/dashboardinicial',
    icon: <BarChart3 />,
    category: 'Dashboard & Analytics',
    gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-700'
  },
  
  // Configurações
  {
    id: 'configuracoes',
    label: 'Configurações',
    route: '/configuracoes',
    icon: <Settings />,
    category: 'Configurações',
    gradient: 'bg-gradient-to-br from-gray-500 to-gray-700'
  },
  
  // Outros
  {
    id: 'clientes',
    label: 'Clientes',
    route: '/oms/clientes',
    icon: <Users />,
    category: 'Outros',
    gradient: 'bg-gradient-to-br from-pink-500 to-pink-700'
  },
  {
    id: 'fornecedores',
    label: 'Fornecedores',
    route: '/fornecedores',
    icon: <Truck />,
    category: 'Outros',
    gradient: 'bg-gradient-to-br from-teal-500 to-teal-700'
  },
];

export const AddShortcutModal = ({
  open,
  onOpenChange,
  onAddShortcut,
  existingShortcutIds,
}: AddShortcutModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filtrar páginas já adicionadas e por busca
  const availablePages = ALL_PAGES.filter(
    (page) =>
      !existingShortcutIds.includes(page.id) &&
      (page.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Agrupar por categoria
  const groupedPages = availablePages.reduce((acc, page) => {
    if (!acc[page.category]) {
      acc[page.category] = [];
    }
    acc[page.category].push(page);
    return acc;
  }, {} as Record<string, PageOption[]>);

  const handleSelectPage = (page: PageOption) => {
    onAddShortcut(page);
    onOpenChange(false);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Adicionar Atalho</DialogTitle>
          <DialogDescription>
            Escolha uma página para adicionar aos atalhos rápidos
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar páginas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Pages List */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {Object.keys(groupedPages).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma página disponível para adicionar
              </p>
            ) : (
              Object.entries(groupedPages).map(([category, pages]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                    {category}
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {pages.map((page) => (
                      <button
                        key={page.id}
                        onClick={() => handleSelectPage(page)}
                        className="group flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div
                          className={cn(
                            "h-16 w-16 rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-105",
                            page.gradient
                          )}
                        >
                          <div className="text-2xl">{page.icon}</div>
                        </div>
                        <span className="text-xs font-medium text-center">
                          {page.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
