import React, { useState, useEffect } from 'react';
import { AddShortcutModal } from '@/components/dashboard/AddShortcutModal';
import pedidosIcon from '@/assets/pedidos-cart-icon.png';
import estoqueIcon from '@/assets/estoque-icon.png';
import adicionarProdutoIcon from '@/assets/adicionar_produto.png';
import adminIcon from '@/assets/admin.png';
import alertasIcon from '@/assets/alertas.png';
import anunciosIcon from '@/assets/anuncios.png';
import auditoriaIcon from '@/assets/auditoria.png';
import calendarioIcon from '@/assets/calendario.png';
import cargosIcon from '@/assets/cargos.png';
import clientesIcon from '@/assets/clientes.png';
import composicoesIcon from '@/assets/composicoes.png';
import configuracoesOmsIcon from '@/assets/configuracoes_oms.png';
import convitesIcon from '@/assets/convites.png';
import cotacoesIcon from '@/assets/cotacoes.png';
import dashboardAnalisesIcon from '@/assets/dashboard_analises.png';
import dashboardEstoqueIcon from '@/assets/dashboard_estoque.png';
import dashboardVendasIcon from '@/assets/dashboard_vendas.png';
import deParaIcon from '@/assets/de_para.png';
import devolucoesIcon from '@/assets/devolucoes.png';
import fornecedoresIcon from '@/assets/fornecedores.png';
import historicoFerramentasIcon from '@/assets/historico_ferramentas.png';
import historicoIcon from '@/assets/historico.png';
import importacaoIcon from '@/assets/importacao.png';
import importarProdutosIcon from '@/assets/importar_produtos.png';
import integracoesIcon from '@/assets/integracoes.png';
import listaProdutosIcon from '@/assets/lista_produtos.png';
import lojaIcon from '@/assets/loja.png';
import notasIcon from '@/assets/notas.png';
import pedidosCompraIcon from '@/assets/pedidos_compra.png';
import pedidosOmsIcon from '@/assets/pedidos_oms.png';
import perfilAdminIcon from '@/assets/perfil_admin.png';
import reclamacoesIcon from '@/assets/reclamacoes.png';
import scannerIcon from '@/assets/scanner.png';
import segurancaIcon from '@/assets/seguranca.png';
import usuariosIcon from '@/assets/usuarios.png';
import vendedoresIcon from '@/assets/vendedores.png';
import visaoGeralIcon from '@/assets/visao_geral.png';
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

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
    imageUrl: pedidosIcon,
    href: '/pedidos',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-700'
  },
  {
    name: 'Estoque',
    imageUrl: estoqueIcon,
    href: '/estoque',
    gradient: 'bg-gradient-to-br from-amber-500 to-amber-700'
  },
  {
    name: 'Vendas Online',
    imageUrl: 'https://img.icons8.com/fluency/96/online-store.png',
    href: '/vendas-online',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-700'
  },
  {
    name: 'Produtos',
    imageUrl: adicionarProdutoIcon,
    href: '/apps/ecommerce/list',
    gradient: 'bg-gradient-to-br from-green-500 to-green-700'
  },
  {
    name: 'Clientes',
    imageUrl: clientesIcon,
    href: '/oms/clientes',
    gradient: 'bg-gradient-to-br from-pink-500 to-pink-700'
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
    const newShortcut: Service = {
      name: page.label,
      imageUrl: page.icon?.props?.src || 'https://img.icons8.com/fluency/96/documents.png',
      href: page.route,
      gradient: page.gradient
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
                {/* Icon */}
                <div className="relative">
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
                  
                  <img
                    src={service.imageUrl}
                    alt={`${service.name} icon`}
                    className="w-20 h-20 object-contain transition-transform duration-300 group-hover:scale-110"
                  />
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
              {/* Add Icon */}
              <div className="relative">
                <img
                  src="https://img.icons8.com/fluency/96/plus-math.png"
                  alt="Adicionar"
                  className="w-20 h-20 object-contain transition-transform duration-300 group-hover:scale-110 opacity-60 group-hover:opacity-100"
                />
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