import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Package,
  Users,
  Calendar,
  BarChart3
} from "lucide-react";
import { useOMSAnalytics } from "../hooks/useOMSAnalytics";

export function OMSPredictiveAnalytics() {
  const { analytics, loading, generateDemandForecast } = useOMSAnalytics();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 0.7) return 'text-red-600';
    if (risk >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Brain className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-lg font-medium">Analisando dados com IA...</p>
            <p className="text-sm text-muted-foreground">Gerando insights preditivos</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Brain className="w-6 h-6 mr-2 text-primary" />
            Analytics Preditivo
          </h2>
          <p className="text-muted-foreground">
            Insights inteligentes para otimizar seu negócio
          </p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar IA
        </Button>
      </div>

      <Tabs defaultValue="demand" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="demand">Previsão Demanda</TabsTrigger>
          <TabsTrigger value="seasonality">Sazonalidade</TabsTrigger>
          <TabsTrigger value="customers">Clientes em Risco</TabsTrigger>
          <TabsTrigger value="suppliers">Score Fornecedores</TabsTrigger>
        </TabsList>

        {/* Demand Forecast */}
        <TabsContent value="demand" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Previsão de Demanda - Próximos 30 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.demandForecast.map((forecast, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Package className="w-5 h-5 text-primary" />
                        <span className="font-medium">{forecast.product}</span>
                      </div>
                      <Badge variant={forecast.currentStock < forecast.predictedDemand ? 'destructive' : 'secondary'}>
                        {forecast.currentStock < forecast.predictedDemand ? 'Reabastecer' : 'Estoque OK'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Estoque Atual</p>
                        <p className="font-medium">{forecast.currentStock} unidades</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Demanda Prevista</p>
                        <p className="font-medium">{forecast.predictedDemand} unidades</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Recomendar Compra</p>
                        <p className="font-medium text-blue-600">{forecast.recommendedOrder} unidades</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Confiança</p>
                        <p className={`font-medium ${getConfidenceColor(forecast.confidence)}`}>
                          {(forecast.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    
                    <Progress 
                      value={forecast.confidence * 100} 
                      className="mt-3"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seasonality */}
        <TabsContent value="seasonality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Análise de Sazonalidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.seasonalityTrends.map((trend, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">{trend.month}</span>
                      <Badge variant={trend.salesMultiplier > 1 ? 'default' : 'secondary'}>
                        {trend.salesMultiplier > 1 ? 'Alto Volume' : 'Volume Normal'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Multiplicador de Vendas</p>
                        <p className="font-medium text-lg">
                          {trend.salesMultiplier}x
                          {trend.salesMultiplier > 1 ? 
                            <TrendingUp className="w-4 h-4 inline ml-1 text-green-500" /> :
                            <TrendingDown className="w-4 h-4 inline ml-1 text-red-500" />
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Categorias em Alta</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {trend.topCategories.map((category, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Risk */}
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Clientes em Risco de Churn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.customerRisk.map((customer, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{customer.customerName}</span>
                      </div>
                      <Badge variant={customer.riskScore > 0.6 ? 'destructive' : 'secondary'}>
                        Risco {customer.riskScore > 0.6 ? 'Alto' : 'Médio'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Score de Risco</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={customer.riskScore * 100} className="flex-1" />
                          <span className={`text-sm font-medium ${getRiskColor(customer.riskScore)}`}>
                            {(customer.riskScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Fatores de Risco</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {customer.riskFactors.map((factor, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          💡 Ação Recomendada
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-300">
                          {customer.recommendedAction}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supplier Scores */}
        <TabsContent value="suppliers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Score de Qualidade dos Fornecedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.supplierScores.map((supplier, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{supplier.supplierName}</span>
                        {getTrendIcon(supplier.trend)}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{supplier.overallScore}</p>
                        <p className="text-sm text-muted-foreground">Score Geral</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Qualidade</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={supplier.qualityScore} className="flex-1" />
                          <span className="text-sm font-medium">{supplier.qualityScore}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Entrega</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={supplier.deliveryScore} className="flex-1" />
                          <span className="text-sm font-medium">{supplier.deliveryScore}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Preço</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={supplier.priceScore} className="flex-1" />
                          <span className="text-sm font-medium">{supplier.priceScore}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}