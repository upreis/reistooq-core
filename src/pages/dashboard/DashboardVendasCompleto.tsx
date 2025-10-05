import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';
import { useDashboardVendas } from '@/features/dashboard/hooks/useDashboardVendas';
import { DashboardHeroCard } from './components/DashboardHeroCard';
import { DashboardKPICards } from './components/DashboardKPICards';
import { DashboardCharts } from './components/DashboardCharts';
import { DashboardStatusCards } from './components/DashboardStatusCards';
import { DashboardProductsTable } from './components/DashboardProductsTable';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { subDays, startOfDay, isAfter, isSameDay } from 'date-fns';

export default function DashboardVendasCompleto() {
  const { vendas, allVendas, isLoading, refetch } = useDashboardVendas();

  // Calcular métricas
  const metrics = useMemo(() => {
    const hoje = startOfDay(new Date());
    const ontem = subDays(hoje, 1);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    const ultimos30Dias = subDays(hoje, 30);
    const ultimos60Dias = subDays(hoje, 60);

    // Vendas hoje
    const vendasHoje = allVendas.filter((v) => {
      const dataVenda = new Date(v.data_pedido);
      return isSameDay(dataVenda, hoje);
    }).length;

    // Vendas ontem
    const vendasOntem = allVendas.filter((v) => {
      const dataVenda = new Date(v.data_pedido);
      return isSameDay(dataVenda, ontem);
    }).length;

    // Crescimento vendas hoje
    const crescimentoHoje = vendasOntem > 0 ? ((vendasHoje - vendasOntem) / vendasOntem) * 100 : 0;

    // Pedidos do mês
    const pedidosMes = allVendas.filter((v) => {
      const dataVenda = new Date(v.data_pedido);
      return isAfter(dataVenda, inicioMes) || isSameDay(dataVenda, inicioMes);
    }).length;

    // Pedidos mês anterior
    const pedidosMesAnterior = allVendas.filter((v) => {
      const dataVenda = new Date(v.data_pedido);
      return isAfter(dataVenda, mesAnterior) && dataVenda <= fimMesAnterior;
    }).length;

    const crescimentoMes = pedidosMesAnterior > 0 ? ((pedidosMes - pedidosMesAnterior) / pedidosMesAnterior) * 100 : 0;

    // Receita total últimos 30 dias
    const receitaUltimos30 = allVendas
      .filter((v) => {
        const dataVenda = new Date(v.data_pedido);
        return isAfter(dataVenda, ultimos30Dias);
      })
      .reduce((acc, v) => acc + (v.valor_total || 0), 0);

    // Receita 30-60 dias atrás
    const receitaAnteriores30 = allVendas
      .filter((v) => {
        const dataVenda = new Date(v.data_pedido);
        return isAfter(dataVenda, ultimos60Dias) && dataVenda <= ultimos30Dias;
      })
      .reduce((acc, v) => acc + (v.valor_total || 0), 0);

    const crescimentoReceita = receitaAnteriores30 > 0 ? ((receitaUltimos30 - receitaAnteriores30) / receitaAnteriores30) * 100 : 0;

    // Clientes únicos do mês
    const clientesMes = new Set(
      allVendas
        .filter((v) => {
          const dataVenda = new Date(v.data_pedido);
          return isAfter(dataVenda, inicioMes) || isSameDay(dataVenda, inicioMes);
        })
        .map((v) => v.cpf_cnpj || v.cliente_nome)
        .filter(Boolean)
    ).size;

    const clientesMesAnterior = new Set(
      allVendas
        .filter((v) => {
          const dataVenda = new Date(v.data_pedido);
          return isAfter(dataVenda, mesAnterior) && dataVenda <= fimMesAnterior;
        })
        .map((v) => v.cpf_cnpj || v.cliente_nome)
        .filter(Boolean)
    ).size;

    const crescimentoClientes = clientesMesAnterior > 0 ? ((clientesMes - clientesMesAnterior) / clientesMesAnterior) * 100 : 0;

    // Vendas diárias últimos 30 dias
    const vendasDiarias: Array<{ data: string; vendas: number; valor: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const dia = subDays(hoje, i);
      const vendasDoDia = allVendas.filter((v) => isSameDay(new Date(v.data_pedido), dia));
      vendasDiarias.push({
        data: dia.toISOString(),
        vendas: vendasDoDia.length,
        valor: vendasDoDia.reduce((acc, v) => acc + (v.valor_total || 0), 0),
      });
    }

    // Top produtos
    const produtosMap = new Map<string, { nome: string; quantidade: number; valor: number }>();
    allVendas.forEach((v) => {
      const key = v.sku_produto || 'Sem SKU';
      const existing = produtosMap.get(key) || { nome: v.descricao || v.sku_produto || 'Sem nome', quantidade: 0, valor: 0 };
      existing.quantidade += v.quantidade || 1;
      existing.valor += v.valor_total || 0;
      produtosMap.set(key, existing);
    });

    const topProdutos = Array.from(produtosMap.entries())
      .map(([sku, data]) => ({ sku, ...data }))
      .sort((a, b) => b.quantidade - a.quantidade);

    // Vendas por canal
    const canaisMap = new Map<string, { vendas: number; valor: number }>();
    allVendas.forEach((v) => {
      const canal = v.empresa || 'Outros';
      const existing = canaisMap.get(canal) || { vendas: 0, valor: 0 };
      existing.vendas += 1;
      existing.valor += v.valor_total || 0;
      canaisMap.set(canal, existing);
    });

    const vendasPorCanal = Array.from(canaisMap.entries())
      .map(([canal, data]) => ({ canal, ...data }))
      .sort((a, b) => b.vendas - a.vendas);

    // Status dos pedidos
    const pendentes = allVendas.filter((v) => v.status?.toLowerCase().includes('pendente') || v.status?.toLowerCase().includes('processando')).length;
    const enviados = allVendas.filter((v) => v.status?.toLowerCase().includes('enviado') || v.status?.toLowerCase().includes('transporte')).length;
    const entregues = allVendas.filter((v) => v.status?.toLowerCase().includes('entregue') || v.status?.toLowerCase().includes('concluída')).length;

    // Produtos para tabela
    const produtosTabela = topProdutos.map((p) => ({
      sku: p.sku,
      nome: p.nome,
      vendas: p.quantidade,
      receita: p.valor,
      status: (p.quantidade > 50 ? 'high' : p.quantidade > 20 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
    }));

    // Meta mensal (exemplo: 100k)
    const metaMensal = 100000;
    const progressoMeta = (receitaUltimos30 / metaMensal) * 100;

    return {
      vendasHoje,
      crescimentoHoje,
      pedidosMes,
      crescimentoMes,
      receitaTotal: receitaUltimos30,
      crescimentoReceita,
      novosClientes: clientesMes,
      crescimentoClientes,
      vendasDiarias,
      topProdutos,
      vendasPorCanal,
      pendentes,
      enviados,
      entregues,
      totalVendas: allVendas.length,
      produtosTabela,
      metaMensal,
      progressoMeta,
    };
  }, [allVendas]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="xl" text="Carregando analytics..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Analytics</h1>
          <p className="text-muted-foreground">
            Análise completa de {metrics.totalVendas.toLocaleString()} vendas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Hero Card */}
      <DashboardHeroCard totalVendas={metrics.totalVendas} crescimento={metrics.crescimentoMes} />

      {/* KPI Cards */}
      <DashboardKPICards
        vendasHoje={metrics.vendasHoje}
        crescimentoHoje={metrics.crescimentoHoje}
        pedidosMes={metrics.pedidosMes}
        crescimentoMes={metrics.crescimentoMes}
        receitaTotal={metrics.receitaTotal}
        crescimentoReceita={metrics.crescimentoReceita}
        novosClientes={metrics.novosClientes}
        crescimentoClientes={metrics.crescimentoClientes}
      />

      {/* Charts */}
      <DashboardCharts
        vendasDiarias={metrics.vendasDiarias}
        topProdutos={metrics.topProdutos}
        vendasPorCanal={metrics.vendasPorCanal}
        metaMensal={metrics.metaMensal}
        progressoMeta={metrics.progressoMeta}
      />

      {/* Status Cards */}
      <DashboardStatusCards
        pendentes={metrics.pendentes}
        enviados={metrics.enviados}
        entregues={metrics.entregues}
        total={metrics.totalVendas}
      />

      {/* Products Table */}
      <DashboardProductsTable produtos={metrics.produtosTabela} />
    </div>
  );
}
