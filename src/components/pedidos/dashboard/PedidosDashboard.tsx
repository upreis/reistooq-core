/**
 * 🚀 DASHBOARD INTELIGENTE DE PEDIDOS - ANÁLISE DINÂMICA
 * Análise em tempo real dos pedidos filtrados com métricas avançadas
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Eye,
  EyeOff,
  RefreshCw,
  BarChart3,
  DollarSign,
  Truck,
  MapPin,
  Calendar,
  ShoppingCart,
  Target,
  Users,
  Award,
  AlertCircle
} from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { format, isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardProps {
  orders: any[];
  loading: boolean;
  onRefresh: () => void;
  className?: string;
}

export function PedidosDashboard({ orders, loading, onRefresh, className }: DashboardProps) {
  const [isVisible, setIsVisible] = useState(false);

  // 📊 ANÁLISE COMPLETA DOS PEDIDOS FILTRADOS
  const dashboardData = useMemo(() => {
    if (!orders?.length) {
      return {
        totalPedidos: 0,
        receitaTotal: 0,
        receitaMedia: 0,
        ticketMedio: 0,
        margemLiquida: 0,
        statusDistribution: {},
        empresasTop: [],
        cidadesTop: [],
        produtosTop: [],
        metricas: {
          entregues: 0,
          pendentes: 0,
          cancelados: 0,
          percentualEntregues: 0,
          receitaFrete: 0,
          custoEnvio: 0,
          taxasMarketplace: 0,
          receitaLiquida: 0
        },
        tendenciasTempo: {
          hoje: 0,
          semana: 0,
          mes: 0
        },
        alertas: []
      };
    }

    const totalPedidos = orders.length;
    
    // 💰 ANÁLISE FINANCEIRA DETALHADA
    let receitaTotal = 0;
    let receitaFrete = 0;
    let custoEnvio = 0;
    let taxasMarketplace = 0;
    let descontos = 0;
    
    orders.forEach(order => {
      // Receita de produtos
      const valorProduto = Number(order.valor_total || 0);
      receitaTotal += isNaN(valorProduto) ? 0 : valorProduto;
      
      // Receita de frete (se Flex)
      const receitaFlexBruta = Number(order.receita_flex || order.receita_envio || 0);
      receitaFrete += isNaN(receitaFlexBruta) ? 0 : receitaFlexBruta;
      
      // Custos e taxas
      const taxaML = Number(order.taxa_marketplace || order.tarifas_venda || 0);
      taxasMarketplace += isNaN(taxaML) ? 0 : taxaML;
      
      const custoEnvioSeller = Number(order.custo_envio_seller || 0);
      custoEnvio += isNaN(custoEnvioSeller) ? 0 : custoEnvioSeller;
      
      const desconto = Number(order.valor_desconto || order.desconto_cupom || 0);
      descontos += isNaN(desconto) ? 0 : desconto;
    });

    const receitaLiquida = receitaTotal + receitaFrete - taxasMarketplace - custoEnvio - descontos;
    const ticketMedio = totalPedidos > 0 ? receitaTotal / totalPedidos : 0;
    const margemLiquida = receitaTotal > 0 ? (receitaLiquida / receitaTotal) * 100 : 0;

    // 📈 ANÁLISE POR STATUS
    const statusCount = orders.reduce((acc, order) => {
      const status = order.situacao || order.status_shipping || 'indefinido';
      const normalizedStatus = String(status).toLowerCase();
      
      if (normalizedStatus.includes('entregue') || normalizedStatus.includes('delivered')) {
        acc.entregues = (acc.entregues || 0) + 1;
      } else if (normalizedStatus.includes('cancelado') || normalizedStatus.includes('cancelled')) {
        acc.cancelados = (acc.cancelados || 0) + 1;
      } else {
        acc.pendentes = (acc.pendentes || 0) + 1;
      }
      
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const entregues = statusCount.entregues || 0;
    const pendentes = statusCount.pendentes || 0;
    const cancelados = statusCount.cancelados || 0;
    const percentualEntregues = totalPedidos > 0 ? (entregues / totalPedidos) * 100 : 0;

    // 🏢 TOP EMPRESAS/CONTAS
    const empresasCount = orders.reduce((acc, order) => {
      const empresa = order.empresa || 'Não informado';
      acc[empresa] = (acc[empresa] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const empresasTop = Object.entries(empresasCount)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([nome, quantidade]) => ({ nome, quantidade: quantidade as number }));

    // 🌎 TOP CIDADES
    const cidadesCount = orders.reduce((acc, order) => {
      const cidade = order.cidade || 'Não informado';
      const uf = order.uf || '';
      const localidade = `${cidade}${uf ? ` - ${uf}` : ''}`;
      acc[localidade] = (acc[localidade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const cidadesTop = Object.entries(cidadesCount)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([nome, quantidade]) => ({ nome, quantidade: quantidade as number }));

    // 📦 TOP PRODUTOS
    const produtosCount = orders.reduce((acc, order) => {
      const skus = order.skus_produtos || order.obs || '';
      if (skus) {
        const produtosList = String(skus).split(',').map(s => s.trim()).filter(Boolean);
        produtosList.forEach(produto => {
          acc[produto] = (acc[produto] || 0) + 1;
        });
      }
      return acc;
    }, {} as Record<string, number>);

    const produtosTop = Object.entries(produtosCount)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([nome, quantidade]) => ({ nome, quantidade: quantidade as number }));

    // ⏰ TENDÊNCIAS TEMPORAIS
    const hoje = new Date();
    let pedidosHoje = 0;
    let pedidosSemana = 0;
    let pedidosMes = 0;

    orders.forEach(order => {
      const datePedido = order.data_pedido || order.created_at;
      if (datePedido) {
        try {
          const date = typeof datePedido === 'string' ? parseISO(datePedido) : new Date(datePedido);
          if (isToday(date)) pedidosHoje++;
          if (isThisWeek(date)) pedidosSemana++;
          if (isThisMonth(date)) pedidosMes++;
        } catch (e) {
          // Ignore invalid dates
        }
      }
    });

    // 🚨 ALERTAS INTELIGENTES
    const alertas = [];
    
    if (pendentes > totalPedidos * 0.3) {
      alertas.push({
        tipo: 'warning',
        titulo: 'Muitos pedidos pendentes',
        descricao: `${pendentes} pedidos (${((pendentes/totalPedidos)*100).toFixed(1)}%) ainda não foram entregues`,
        icon: AlertTriangle
      });
    }

    if (margemLiquida < 10) {
      alertas.push({
        tipo: 'danger',
        titulo: 'Margem baixa',
        descricao: `Margem líquida de ${margemLiquida.toFixed(1)}% está abaixo do ideal`,
        icon: TrendingDown
      });
    }

    if (cancelados > totalPedidos * 0.1) {
      alertas.push({
        tipo: 'warning',
        titulo: 'Taxa de cancelamento alta',
        descricao: `${cancelados} cancelamentos (${((cancelados/totalPedidos)*100).toFixed(1)}%)`,
        icon: AlertCircle
      });
    }

    return {
      totalPedidos,
      receitaTotal,
      receitaMedia: ticketMedio,
      ticketMedio,
      margemLiquida,
      statusDistribution: statusCount,
      empresasTop,
      cidadesTop,
      produtosTop,
      metricas: {
        entregues,
        pendentes,
        cancelados,
        percentualEntregues,
        receitaFrete,
        custoEnvio,
        taxasMarketplace,
        receitaLiquida
      },
      tendenciasTempo: {
        hoje: pedidosHoje,
        semana: pedidosSemana,
        mes: pedidosMes
      },
      alertas
    };
  }, [orders]);

  // 📊 WIDGETS PRINCIPAIS
  const widgets = [
    {
      title: 'Total de Pedidos',
      value: dashboardData.totalPedidos,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      subtitle: `${dashboardData.tendenciasTempo.hoje} hoje`
    },
    {
      title: 'Receita Total',
      value: formatMoney(dashboardData.receitaTotal),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      subtitle: `Ticket médio: ${formatMoney(dashboardData.ticketMedio)}`
    },
    {
      title: 'Taxa de Entrega',
      value: `${dashboardData.metricas.percentualEntregues.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      subtitle: `${dashboardData.metricas.entregues} entregues`
    },
    {
      title: 'Margem Líquida',
      value: `${dashboardData.margemLiquida.toFixed(1)}%`,
      icon: TrendingUp,
      color: dashboardData.margemLiquida > 15 ? 'text-green-600' : dashboardData.margemLiquida > 5 ? 'text-yellow-600' : 'text-red-600',
      bgColor: dashboardData.margemLiquida > 15 ? 'bg-green-50' : dashboardData.margemLiquida > 5 ? 'bg-yellow-50' : 'bg-red-50',
      subtitle: formatMoney(dashboardData.metricas.receitaLiquida)
    }
  ];

  if (!isVisible) {
    return (
      <div className={cn("mb-6", className)}>
        <Button
          variant="outline"
          onClick={() => setIsVisible(true)}
          className="w-full border-dashed"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          📊 Mostrar Análise dos Pedidos Filtrados ({dashboardData.totalPedidos} pedidos)
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("mb-6 space-y-4", className)}>
      {/* Header do Dashboard */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">📊 Análise dos Pedidos Filtrados</h3>
          <Badge variant="secondary">{dashboardData.totalPedidos} pedidos</Badge>
          {loading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 🚨 ALERTAS */}
      {dashboardData.alertas.length > 0 && (
        <div className="space-y-2">
          {dashboardData.alertas.map((alerta, index) => (
            <Card key={index} className={cn(
              "border-l-4",
              alerta.tipo === 'danger' ? 'border-l-red-500 bg-red-50' : 'border-l-yellow-500 bg-yellow-50'
            )}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <alerta.icon className={cn(
                    "h-5 w-5",
                    alerta.tipo === 'danger' ? 'text-red-600' : 'text-yellow-600'
                  )} />
                  <div>
                    <p className={cn(
                      "font-medium",
                      alerta.tipo === 'danger' ? 'text-red-800' : 'text-yellow-800'
                    )}>
                      {alerta.titulo}
                    </p>
                    <p className={cn(
                      "text-sm",
                      alerta.tipo === 'danger' ? 'text-red-700' : 'text-yellow-700'
                    )}>
                      {alerta.descricao}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 📊 WIDGETS PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets.map((widget, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {widget.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {widget.value}
                  </p>
                  {widget.subtitle && (
                    <p className="text-xs text-muted-foreground">
                      {widget.subtitle}
                    </p>
                  )}
                </div>
                <div className={cn("p-3 rounded-lg", widget.bgColor)}>
                  <widget.icon className={cn("h-6 w-6", widget.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 📈 ANÁLISE DETALHADA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* 🏢 TOP EMPRESAS */}
        {dashboardData.empresasTop.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4" />
                Top Empresas/Contas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.empresasTop.map((empresa, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium truncate">{empresa.nome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{empresa.quantidade}</span>
                      <Progress 
                        value={(empresa.quantidade / dashboardData.totalPedidos) * 100} 
                        className="w-16 h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 🌎 TOP CIDADES */}
        {dashboardData.cidadesTop.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Top Destinos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.cidadesTop.map((cidade, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium truncate">{cidade.nome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{cidade.quantidade}</span>
                      <Progress 
                        value={(cidade.quantidade / dashboardData.totalPedidos) * 100} 
                        className="w-16 h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 📦 TOP PRODUTOS */}
      {dashboardData.produtosTop.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dashboardData.produtosTop.map((produto, index) => (
                <div key={index} className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-bold">{produto.quantidade}</span>
                  </div>
                  <p className="text-sm font-medium truncate" title={produto.nome}>
                    {produto.nome}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 💰 BREAKDOWN FINANCEIRO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Breakdown Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-green-50">
              <p className="text-sm text-muted-foreground">Receita Produtos</p>
              <p className="text-lg font-bold text-green-600">{formatMoney(dashboardData.receitaTotal)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50">
              <p className="text-sm text-muted-foreground">Receita Frete</p>
              <p className="text-lg font-bold text-blue-600">{formatMoney(dashboardData.metricas.receitaFrete)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50">
              <p className="text-sm text-muted-foreground">Taxas ML</p>
              <p className="text-lg font-bold text-red-600">-{formatMoney(dashboardData.metricas.taxasMarketplace)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-50">
              <p className="text-sm text-muted-foreground">Líquido</p>
              <p className="text-lg font-bold text-emerald-600">{formatMoney(dashboardData.metricas.receitaLiquida)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ⏰ TENDÊNCIAS TEMPORAIS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Distribuição Temporal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground">Hoje</p>
              <p className="text-xl font-bold">{dashboardData.tendenciasTempo.hoje}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground">Esta Semana</p>
              <p className="text-xl font-bold">{dashboardData.tendenciasTempo.semana}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground">Este Mês</p>
              <p className="text-xl font-bold">{dashboardData.tendenciasTempo.mes}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}