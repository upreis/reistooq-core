import { useState, useEffect } from 'react';

export interface PredictiveAnalytics {
  demandForecast: {
    product: string;
    currentStock: number;
    predictedDemand: number;
    recommendedOrder: number;
    confidence: number;
  }[];
  seasonalityTrends: {
    month: string;
    salesMultiplier: number;
    topCategories: string[];
  }[];
  customerRisk: {
    customerId: string;
    customerName: string;
    riskScore: number;
    riskFactors: string[];
    recommendedAction: string;
  }[];
  supplierScores: {
    supplierId: string;
    supplierName: string;
    qualityScore: number;
    deliveryScore: number;
    priceScore: number;
    overallScore: number;
    trend: 'up' | 'down' | 'stable';
  }[];
}

export function useOMSAnalytics() {
  const [analytics, setAnalytics] = useState<PredictiveAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock predictive analytics data
  const mockAnalytics: PredictiveAnalytics = {
    demandForecast: [
      {
        product: 'iPhone 15 Pro',
        currentStock: 25,
        predictedDemand: 45,
        recommendedOrder: 30,
        confidence: 0.85
      },
      {
        product: 'Samsung Galaxy S24',
        currentStock: 18,
        predictedDemand: 35,
        recommendedOrder: 25,
        confidence: 0.78
      },
      {
        product: 'MacBook Air M3',
        currentStock: 8,
        predictedDemand: 20,
        recommendedOrder: 15,
        confidence: 0.92
      }
    ],
    seasonalityTrends: [
      {
        month: 'Janeiro',
        salesMultiplier: 0.8,
        topCategories: ['Eletrônicos', 'Casa']
      },
      {
        month: 'Dezembro',
        salesMultiplier: 1.5,
        topCategories: ['Eletrônicos', 'Presentes', 'Roupas']
      },
      {
        month: 'Novembro',
        salesMultiplier: 1.3,
        topCategories: ['Eletrônicos', 'Eletrodomésticos']
      }
    ],
    customerRisk: [
      {
        customerId: '1',
        customerName: 'João Silva',
        riskScore: 0.75,
        riskFactors: ['Pagamentos em atraso', 'Cancelamentos recentes'],
        recommendedAction: 'Oferecer desconto para fidelização'
      },
      {
        customerId: '2',
        customerName: 'Maria Santos',
        riskScore: 0.35,
        riskFactors: ['Diminuição na frequência de compras'],
        recommendedAction: 'Campanha de reativação'
      }
    ],
    supplierScores: [
      {
        supplierId: '1',
        supplierName: 'Fornecedor Premium Ltda',
        qualityScore: 95,
        deliveryScore: 88,
        priceScore: 72,
        overallScore: 85,
        trend: 'up'
      },
      {
        supplierId: '2',
        supplierName: 'Distribuidora Nacional S.A.',
        qualityScore: 82,
        deliveryScore: 95,
        priceScore: 85,
        overallScore: 87,
        trend: 'stable'
      },
      {
        supplierId: '3',
        supplierName: 'Tech Solutions EIRELI',
        qualityScore: 70,
        deliveryScore: 65,
        priceScore: 90,
        overallScore: 75,
        trend: 'down'
      }
    ]
  };

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setAnalytics(mockAnalytics);
      setLoading(false);
    }, 1500);
  }, []);

  const generateDemandForecast = async (productId: string, timeframe: number) => {
    // Simulate ML prediction
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const forecast = {
      productId,
      predictions: Array.from({ length: timeframe }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
        predictedSales: Math.floor(Math.random() * 50) + 10,
        confidence: Math.random() * 0.3 + 0.7
      }))
    };
    
    setLoading(false);
    return forecast;
  };

  const analyzeCustomerBehavior = async (customerId: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const behavior = {
      customerId,
      purchasePattern: 'monthly',
      averageOrderValue: 350,
      preferredCategories: ['Eletrônicos', 'Casa'],
      churnProbability: 0.15,
      lifetimeValue: 2500
    };
    
    setLoading(false);
    return behavior;
  };

  return {
    analytics,
    loading,
    generateDemandForecast,
    analyzeCustomerBehavior
  };
}