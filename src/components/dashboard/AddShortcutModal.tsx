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
import estoqueIcon from "@/assets/estoque-icon.png";
import adicionarProdutoIcon from "@/assets/adicionar_produto.png";
import adminIcon from "@/assets/admin.png";
import alertasIcon from "@/assets/alertas.png";
import anunciosIcon from "@/assets/anuncios.png";
import auditoriaIcon from "@/assets/auditoria.png";
import calendarioIcon from "@/assets/calendario.png";
import cargosIcon from "@/assets/cargos.png";
import clientesIcon from "@/assets/clientes.png";
import composicoesIcon from "@/assets/composicoes.png";
import configuracoesOmsIcon from "@/assets/configuracoes_oms.png";
import convitesIcon from "@/assets/convites.png";
import cotacoesIcon from "@/assets/cotacoes.png";
import dashboardAnalisesIcon from "@/assets/dashboard_analises.png";
import dashboardEstoqueIcon from "@/assets/dashboard_estoque.png";
import dashboardVendasIcon from "@/assets/dashboard_vendas.png";
import deParaIcon from "@/assets/de_para.png";
import devolucoesIcon from "@/assets/devolucoes.png";
import fornecedoresIcon from "@/assets/fornecedores.png";
import historicoFerramentasIcon from "@/assets/historico_ferramentas.png";
import historicoIcon from "@/assets/historico.png";
import importacaoIcon from "@/assets/importacao.png";
import importarProdutosIcon from "@/assets/importar_produtos.png";
import integracoesIcon from "@/assets/integracoes.png";
import listaProdutosIcon from "@/assets/lista_produtos.png";
import lojaIcon from "@/assets/loja.png";
import notasIcon from "@/assets/notas.png";
import pedidosCompraIcon from "@/assets/pedidos_compra.png";
import pedidosOmsIcon from "@/assets/pedidos_oms.png";
import perfilAdminIcon from "@/assets/perfil_admin.png";
import reclamacoesIcon from "@/assets/reclamacoes.png";
import scannerIcon from "@/assets/scanner.png";
import segurancaIcon from "@/assets/seguranca.png";
import usuariosIcon from "@/assets/usuarios.png";
import vendedoresIcon from "@/assets/vendedores.png";
import visaoGeralIcon from "@/assets/visao_geral.png";

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
    icon: <img src={visaoGeralIcon} alt="Visão Geral" className="w-16 h-16 object-contain" />,
    category: 'Dashboard',
    gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-700'
  },
  {
    id: 'dashboard-vendas',
    label: 'Dashboard Vendas',
    route: '/dashboardinicial/vendas',
    icon: <img src={dashboardVendasIcon} alt="Dashboard Vendas" className="w-16 h-16 object-contain" />,
    category: 'Dashboard',
    gradient: 'bg-gradient-to-br from-green-500 to-green-700'
  },
  {
    id: 'dashboard-estoque',
    label: 'Dashboard Estoque',
    route: '/dashboardinicial/estoque',
    icon: <img src={dashboardEstoqueIcon} alt="Dashboard Estoque" className="w-16 h-16 object-contain" />,
    category: 'Dashboard',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-700'
  },
  {
    id: 'dashboard-analises',
    label: 'Dashboard Análises',
    route: '/dashboardinicial/analises',
    icon: <img src={dashboardAnalisesIcon} alt="Dashboard Análises" className="w-16 h-16 object-contain" />,
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
    icon: <img src={pedidosOmsIcon} alt="OMS - Pedidos" className="w-16 h-16 object-contain" />,
    category: 'OMS',
    gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-700'
  },
  {
    id: 'oms-clientes',
    label: 'OMS - Clientes',
    route: '/oms/clientes',
    icon: <img src={clientesIcon} alt="Clientes" className="w-16 h-16 object-contain" />,
    category: 'OMS',
    gradient: 'bg-gradient-to-br from-pink-500 to-pink-700'
  },
  {
    id: 'oms-vendedores',
    label: 'OMS - Vendedores',
    route: '/oms/vendedores',
    icon: <img src={vendedoresIcon} alt="Vendedores" className="w-16 h-16 object-contain" />,
    category: 'OMS',
    gradient: 'bg-gradient-to-br from-violet-500 to-violet-700'
  },
  {
    id: 'oms-configuracoes',
    label: 'OMS - Configurações',
    route: '/oms/configuracoes',
    icon: <img src={configuracoesOmsIcon} alt="Configurações" className="w-16 h-16 object-contain" />,
    category: 'OMS',
    gradient: 'bg-gradient-to-br from-slate-500 to-slate-700'
  },
  
  // Estoque
  {
    id: 'estoque',
    label: 'Estoque',
    route: '/estoque',
    icon: <img src={estoqueIcon} alt="Estoque" className="w-16 h-16 object-contain" />,
    category: 'Estoque',
    gradient: 'bg-gradient-to-br from-amber-500 to-amber-700'
  },
  {
    id: 'estoque-composicoes',
    label: 'Composições',
    route: '/estoque/composicoes',
    icon: <img src={composicoesIcon} alt="Composições" className="w-16 h-16 object-contain" />,
    category: 'Estoque',
    gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700'
  },
  {
    id: 'estoque-historico',
    label: 'Histórico',
    route: '/estoque/historico',
    icon: <img src={historicoFerramentasIcon} alt="Histórico" className="w-16 h-16 object-contain" />,
    category: 'Estoque',
    gradient: 'bg-gradient-to-br from-teal-500 to-teal-700'
  },
  
  // Devoluções & Reclamações
  {
    id: 'devolucoesdevenda',
    label: 'Devoluções',
    route: '/devolucoesdevenda',
    icon: <img src={devolucoesIcon} alt="Devoluções" className="w-16 h-16 object-contain" />,
    category: 'Devoluções & Reclamações',
    gradient: 'bg-gradient-to-br from-orange-500 to-orange-700'
  },
  {
    id: 'reclamacoes',
    label: 'Reclamações',
    route: '/reclamacoes',
    icon: <img src={reclamacoesIcon} alt="Reclamações" className="w-16 h-16 object-contain" />,
    category: 'Devoluções & Reclamações',
    gradient: 'bg-gradient-to-br from-red-500 to-red-700'
  },

  // Compras
  {
    id: 'compras-pedidos',
    label: 'Pedidos de Compra',
    route: '/compras/pedidos',
    icon: <img src={pedidosCompraIcon} alt="Pedidos de Compra" className="w-16 h-16 object-contain" />,
    category: 'Compras',
    gradient: 'bg-gradient-to-br from-blue-600 to-blue-800'
  },
  {
    id: 'compras-cotacoes',
    label: 'Cotações',
    route: '/compras/cotacoes',
    icon: <img src={cotacoesIcon} alt="Cotações" className="w-16 h-16 object-contain" />,
    category: 'Compras',
    gradient: 'bg-gradient-to-br from-indigo-600 to-indigo-800'
  },
  {
    id: 'compras-fornecedores',
    label: 'Fornecedores',
    route: '/compras/fornecedores',
    icon: <img src={fornecedoresIcon} alt="Fornecedores" className="w-16 h-16 object-contain" />,
    category: 'Compras',
    gradient: 'bg-gradient-to-br from-teal-600 to-teal-800'
  },
  {
    id: 'compras-importacao',
    label: 'Importação',
    route: '/compras/importacao',
    icon: <img src={importacaoIcon} alt="Importação" className="w-16 h-16 object-contain" />,
    category: 'Compras',
    gradient: 'bg-gradient-to-br from-cyan-600 to-cyan-800'
  },

  // Aplicativos
  {
    id: 'aplicativos-calendario',
    label: 'Calendário',
    route: '/aplicativos/calendario',
    icon: <img src={calendarioIcon} alt="Calendário" className="w-16 h-16 object-contain" />,
    category: 'Aplicativos',
    gradient: 'bg-gradient-to-br from-red-500 to-red-700'
  },
  {
    id: 'aplicativos-notas',
    label: 'Notas',
    route: '/aplicativos/notas',
    icon: <img src={notasIcon} alt="Notas" className="w-16 h-16 object-contain" />,
    category: 'Aplicativos',
    gradient: 'bg-gradient-to-br from-yellow-500 to-yellow-700'
  },

  // E-commerce
  {
    id: 'ecommerce-shop',
    label: 'Loja',
    route: '/apps/ecommerce/shop',
    icon: <img src={lojaIcon} alt="Loja" className="w-16 h-16 object-contain" />,
    category: 'E-commerce',
    gradient: 'bg-gradient-to-br from-purple-600 to-purple-800'
  },
  {
    id: 'ecommerce-list',
    label: 'Lista de Produtos',
    route: '/apps/ecommerce/list',
    icon: <img src={listaProdutosIcon} alt="Lista de Produtos" className="w-16 h-16 object-contain" />,
    category: 'E-commerce',
    gradient: 'bg-gradient-to-br from-violet-600 to-violet-800'
  },
  {
    id: 'ecommerce-add',
    label: 'Adicionar Produto',
    route: '/apps/ecommerce/addproduct',
    icon: <img src={adicionarProdutoIcon} alt="Adicionar Produto" className="w-16 h-16 object-contain" />,
    category: 'E-commerce',
    gradient: 'bg-gradient-to-br from-amber-500 to-amber-700'
  },
  {
    id: 'ecommerce-import',
    label: 'Importar Produtos',
    route: '/apps/ecommerce/import',
    icon: <img src={importarProdutosIcon} alt="Importar Produtos" className="w-16 h-16 object-contain" />,
    category: 'E-commerce',
    gradient: 'bg-gradient-to-br from-pink-600 to-pink-800'
  },

  // Configurações
  {
    id: 'configuracoes-integracoes',
    label: 'Integrações',
    route: '/configuracoes/integracoes',
    icon: <img src={integracoesIcon} alt="Integrações" className="w-16 h-16 object-contain" />,
    category: 'Configurações',
    gradient: 'bg-gradient-to-br from-gray-500 to-gray-700'
  },
  {
    id: 'configuracoes-anuncios',
    label: 'Anúncios',
    route: '/configuracoes/anuncios',
    icon: <img src={anunciosIcon} alt="Anúncios" className="w-16 h-16 object-contain" />,
    category: 'Configurações',
    gradient: 'bg-gradient-to-br from-pink-500 to-pink-700'
  },

  // Admin
  {
    id: 'admin',
    label: 'Admin',
    route: '/admin',
    icon: <img src={adminIcon} alt="Admin" className="w-16 h-16 object-contain" />,
    category: 'Administração',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-700'
  },
  {
    id: 'admin-usuarios',
    label: 'Usuários',
    route: '/admin/usuarios',
    icon: <img src={usuariosIcon} alt="Usuários" className="w-16 h-16 object-contain" />,
    category: 'Administração',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-700'
  },
  {
    id: 'admin-cargos',
    label: 'Cargos',
    route: '/admin/cargos',
    icon: <img src={cargosIcon} alt="Cargos" className="w-16 h-16 object-contain" />,
    category: 'Administração',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-700'
  },
  {
    id: 'admin-convites',
    label: 'Convites',
    route: '/admin/convites',
    icon: <img src={convitesIcon} alt="Convites" className="w-16 h-16 object-contain" />,
    category: 'Administração',
    gradient: 'bg-gradient-to-br from-fuchsia-600 to-fuchsia-800'
  },
  {
    id: 'admin-alertas',
    label: 'Alertas',
    route: '/admin/alertas',
    icon: <img src={alertasIcon} alt="Alertas" className="w-16 h-16 object-contain" />,
    category: 'Administração',
    gradient: 'bg-gradient-to-br from-orange-500 to-orange-700'
  },
  {
    id: 'admin-seguranca',
    label: 'Segurança',
    route: '/admin/seguranca',
    icon: <img src={segurancaIcon} alt="Segurança" className="w-16 h-16 object-contain" />,
    category: 'Administração',
    gradient: 'bg-gradient-to-br from-green-500 to-green-700'
  },
  {
    id: 'admin-auditoria',
    label: 'Auditoria',
    route: '/admin/auditoria',
    icon: <img src={auditoriaIcon} alt="Auditoria" className="w-16 h-16 object-contain" />,
    category: 'Administração',
    gradient: 'bg-gradient-to-br from-teal-500 to-teal-700'
  },
  {
    id: 'admin-perfil',
    label: 'Perfil Admin',
    route: '/admin/perfil',
    icon: <img src={perfilAdminIcon} alt="Perfil Admin" className="w-16 h-16 object-contain" />,
    category: 'Administração',
    gradient: 'bg-gradient-to-br from-yellow-600 to-yellow-800'
  },

  // Ferramentas
  {
    id: 'scanner',
    label: 'Scanner',
    route: '/scanner',
    icon: <img src={scannerIcon} alt="Scanner" className="w-16 h-16 object-contain" />,
    category: 'Ferramentas',
    gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-700'
  },
  {
    id: 'de-para',
    label: 'De-Para',
    route: '/de-para',
    icon: <img src={deParaIcon} alt="De-Para" className="w-16 h-16 object-contain" />,
    category: 'Ferramentas',
    gradient: 'bg-gradient-to-br from-green-600 to-green-800'
  },
  {
    id: 'alertas',
    label: 'Alertas',
    route: '/alertas',
    icon: <img src={alertasIcon} alt="Alertas" className="w-16 h-16 object-contain" />,
    category: 'Ferramentas',
    gradient: 'bg-gradient-to-br from-orange-500 to-orange-700'
  },
  {
    id: 'historico',
    label: 'Histórico',
    route: '/historico',
    icon: <img src={historicoIcon} alt="Histórico" className="w-16 h-16 object-contain" />,
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
