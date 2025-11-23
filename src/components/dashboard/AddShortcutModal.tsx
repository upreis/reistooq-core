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
  Shield,
  Link,
  StickyNote,
  Scan,
  ArrowLeftRight,
  History,
  Plus,
  List,
  Edit,
  Upload,
  Home,
  Activity,
  Layers,
  PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import pedidosIcon from "@/assets/pedidos-cart-icon.png";

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
  // Dashboard
  {
    id: 'dashboard-visao-geral',
    label: 'Visão Geral',
    route: '/dashboardinicial/visao-geral',
    icon: <Home />,
    category: 'Dashboard',
    gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-700'
  },
  {
    id: 'dashboard-vendas',
    label: 'Dashboard Vendas',
    route: '/dashboardinicial/vendas',
    icon: <TrendingUp />,
    category: 'Dashboard',
    gradient: 'bg-gradient-to-br from-green-500 to-green-700'
  },
  {
    id: 'dashboard-estoque',
    label: 'Dashboard Estoque',
    route: '/dashboardinicial/estoque',
    icon: <Package />,
    category: 'Dashboard',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-700'
  },
  {
    id: 'dashboard-analises',
    label: 'Dashboard Análises',
    route: '/dashboardinicial/analises',
    icon: <PieChart />,
    category: 'Dashboard',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-700'
  },

  // Vendas & Pedidos
  {
    id: 'pedidos',
    label: 'Pedidos',
    route: '/pedidos',
    icon: <img src={pedidosIcon} alt="Pedidos" className="w-16 h-16 object-contain" />,
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
  
  // OMS
  {
    id: 'oms-pedidos',
    label: 'OMS - Pedidos',
    route: '/oms/pedidos',
    icon: <ClipboardList />,
    category: 'OMS',
    gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-700'
  },
  {
    id: 'oms-clientes',
    label: 'OMS - Clientes',
    route: '/oms/clientes',
    icon: <Users />,
    category: 'OMS',
    gradient: 'bg-gradient-to-br from-pink-500 to-pink-700'
  },
  {
    id: 'oms-vendedores',
    label: 'OMS - Vendedores',
    route: '/oms/vendedores',
    icon: <Users />,
    category: 'OMS',
    gradient: 'bg-gradient-to-br from-violet-500 to-violet-700'
  },
  {
    id: 'oms-configuracoes',
    label: 'OMS - Configurações',
    route: '/oms/configuracoes',
    icon: <Settings />,
    category: 'OMS',
    gradient: 'bg-gradient-to-br from-slate-500 to-slate-700'
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
    id: 'estoque-composicoes',
    label: 'Composições',
    route: '/estoque/composicoes',
    icon: <Layers />,
    category: 'Estoque',
    gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700'
  },
  {
    id: 'estoque-historico',
    label: 'Histórico',
    route: '/estoque/historico',
    icon: <History />,
    category: 'Estoque',
    gradient: 'bg-gradient-to-br from-teal-500 to-teal-700'
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
    id: 'reclamacoes',
    label: 'Reclamações',
    route: '/reclamacoes',
    icon: <AlertCircle />,
    category: 'Devoluções & Reclamações',
    gradient: 'bg-gradient-to-br from-red-500 to-red-700'
  },

  // Compras
  {
    id: 'compras-pedidos',
    label: 'Pedidos de Compra',
    route: '/compras/pedidos',
    icon: <ShoppingCart />,
    category: 'Compras',
    gradient: 'bg-gradient-to-br from-blue-600 to-blue-800'
  },
  {
    id: 'compras-cotacoes',
    label: 'Cotações',
    route: '/compras/cotacoes',
    icon: <FileText />,
    category: 'Compras',
    gradient: 'bg-gradient-to-br from-indigo-600 to-indigo-800'
  },
  {
    id: 'compras-fornecedores',
    label: 'Fornecedores',
    route: '/compras/fornecedores',
    icon: <Truck />,
    category: 'Compras',
    gradient: 'bg-gradient-to-br from-teal-600 to-teal-800'
  },
  {
    id: 'compras-importacao',
    label: 'Importação',
    route: '/compras/importacao',
    icon: <Upload />,
    category: 'Compras',
    gradient: 'bg-gradient-to-br from-cyan-600 to-cyan-800'
  },

  // Aplicativos
  {
    id: 'aplicativos-calendario',
    label: 'Calendário',
    route: '/aplicativos/calendario',
    icon: <Calendar />,
    category: 'Aplicativos',
    gradient: 'bg-gradient-to-br from-sky-500 to-sky-700'
  },
  {
    id: 'aplicativos-notas',
    label: 'Notas',
    route: '/aplicativos/notas',
    icon: <StickyNote />,
    category: 'Aplicativos',
    gradient: 'bg-gradient-to-br from-yellow-500 to-yellow-700'
  },

  // E-commerce
  {
    id: 'ecommerce-shop',
    label: 'Loja',
    route: '/apps/ecommerce/shop',
    icon: <Store />,
    category: 'E-commerce',
    gradient: 'bg-gradient-to-br from-purple-600 to-purple-800'
  },
  {
    id: 'ecommerce-list',
    label: 'Lista de Produtos',
    route: '/apps/ecommerce/list',
    icon: <List />,
    category: 'E-commerce',
    gradient: 'bg-gradient-to-br from-violet-600 to-violet-800'
  },
  {
    id: 'ecommerce-add',
    label: 'Adicionar Produto',
    route: '/apps/ecommerce/addproduct',
    icon: <Plus />,
    category: 'E-commerce',
    gradient: 'bg-gradient-to-br from-fuchsia-600 to-fuchsia-800'
  },
  {
    id: 'ecommerce-import',
    label: 'Importar Produtos',
    route: '/apps/ecommerce/import',
    icon: <Upload />,
    category: 'E-commerce',
    gradient: 'bg-gradient-to-br from-pink-600 to-pink-800'
  },

  // Configurações
  {
    id: 'configuracoes-integracoes',
    label: 'Integrações',
    route: '/configuracoes/integracoes',
    icon: <Link />,
    category: 'Configurações',
    gradient: 'bg-gradient-to-br from-gray-500 to-gray-700'
  },
  {
    id: 'configuracoes-anuncios',
    label: 'Anúncios',
    route: '/configuracoes/anuncios',
    icon: <MessageSquare />,
    category: 'Configurações',
    gradient: 'bg-gradient-to-br from-slate-500 to-slate-700'
  },

  // Admin
  {
    id: 'admin',
    label: 'Admin',
    route: '/admin',
    icon: <Shield />,
    category: 'Administração',
    gradient: 'bg-gradient-to-br from-red-600 to-red-800'
  },
  {
    id: 'admin-usuarios',
    label: 'Usuários',
    route: '/admin/usuarios',
    icon: <Users />,
    category: 'Administração',
    gradient: 'bg-gradient-to-br from-rose-600 to-rose-800'
  },
  {
    id: 'admin-cargos',
    label: 'Cargos',
    route: '/admin/cargos',
    icon: <Shield />,
    category: 'Administração',
    gradient: 'bg-gradient-to-br from-pink-600 to-pink-800'
  },
  {
    id: 'admin-convites',
    label: 'Convites',
    route: '/admin/convites',
    icon: <Bell />,
    category: 'Administração',
    gradient: 'bg-gradient-to-br from-fuchsia-600 to-fuchsia-800'
  },
  {
    id: 'admin-alertas',
    label: 'Alertas',
    route: '/admin/alertas',
    icon: <AlertCircle />,
    category: 'Administração',
    gradient: 'bg-gradient-to-br from-orange-600 to-orange-800'
  },
  {
    id: 'admin-seguranca',
    label: 'Segurança',
    route: '/admin/seguranca',
    icon: <Shield />,
    category: 'Administração',
    gradient: 'bg-gradient-to-br from-red-700 to-red-900'
  },
  {
    id: 'admin-auditoria',
    label: 'Auditoria',
    route: '/admin/auditoria',
    icon: <FileText />,
    category: 'Administração',
    gradient: 'bg-gradient-to-br from-amber-600 to-amber-800'
  },
  {
    id: 'admin-perfil',
    label: 'Perfil Admin',
    route: '/admin/perfil',
    icon: <Users />,
    category: 'Administração',
    gradient: 'bg-gradient-to-br from-yellow-600 to-yellow-800'
  },

  // Ferramentas
  {
    id: 'scanner',
    label: 'Scanner',
    route: '/scanner',
    icon: <Scan />,
    category: 'Ferramentas',
    gradient: 'bg-gradient-to-br from-lime-500 to-lime-700'
  },
  {
    id: 'de-para',
    label: 'De-Para',
    route: '/de-para',
    icon: <ArrowLeftRight />,
    category: 'Ferramentas',
    gradient: 'bg-gradient-to-br from-green-600 to-green-800'
  },
  {
    id: 'alertas',
    label: 'Alertas',
    route: '/alertas',
    icon: <Bell />,
    category: 'Ferramentas',
    gradient: 'bg-gradient-to-br from-amber-500 to-amber-700'
  },
  {
    id: 'historico',
    label: 'Histórico',
    route: '/historico',
    icon: <History />,
    category: 'Ferramentas',
    gradient: 'bg-gradient-to-br from-stone-500 to-stone-700'
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
