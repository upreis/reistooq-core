import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Mock data para demonstração
const mockCustomers = [
  {
    id: "1",
    name: "Cliente Exemplo",
    doc: "12.345.678/0001-90",
    email: "cliente@exemplo.com",
    phone: "(11) 99999-9999",
    price_tier: "standard" as const,
    payment_terms: "30_days",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockSalesReps = [
  {
    id: "1",
    name: "João Silva",
    email: "joao@empresa.com",
    phone: "(11) 88888-8888",
    default_commission_pct: 5.0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockProducts = [
  {
    id: "1",
    sku: "PROD-001",
    title: "Produto Exemplo 1",
    price: 29.90,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "2",
    sku: "PROD-002",
    title: "Produto Exemplo 2",
    price: 49.90,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "3",
    sku: "PROD-003",
    title: "Produto Exemplo 3",
    price: 99.90,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

type OrderStatus = 'draft' | 'approved' | 'invoiced' | 'cancelled';

const mockOrders = [
  {
    id: "1",
    number: "000001/2025",
    customer_id: "1",
    sales_rep_id: "1",
    status: "draft" as OrderStatus,
    subtotal: 149.70,
    discount_total: 0,
    tax_total: 0,
    shipping_total: 15.00,
    grand_total: 164.70,
    notes: "Pedido de exemplo",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    oms_customers: mockCustomers[0],
    oms_sales_reps: mockSalesReps[0],
    oms_order_items: [
      {
        id: "1",
        sku: "PROD-001",
        title: "Produto Exemplo 1",
        qty: 2,
        unit_price: 29.90,
        discount_pct: 0,
        discount_value: 0,
        tax_value: 0,
        total: 59.80
      },
      {
        id: "2",
        sku: "PROD-002",
        title: "Produto Exemplo 2",
        qty: 1,
        unit_price: 49.90,
        discount_pct: 10,
        discount_value: 4.99,
        tax_value: 0,
        total: 44.91
      }
    ]
  }
];

export function useOMSCustomers() {
  const [customers, setCustomers] = useState(mockCustomers);
  const [loading, setLoading] = useState(false);

  const createCustomer = async (data: any) => {
    setLoading(true);
    try {
      // Simular criação
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newCustomer = {
        ...data,
        id: Date.now().toString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setCustomers([...customers, newCustomer]);
      return newCustomer;
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (id: string, data: any) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCustomers(customers.map(c => 
        c.id === id ? { ...c, ...data, updated_at: new Date().toISOString() } : c
      ));
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCustomers(customers.filter(c => c.id !== id));
    } finally {
      setLoading(false);
    }
  };

  return {
    customers,
    loading,
    createCustomer,
    updateCustomer,
    deleteCustomer
  };
}

export function useOMSSalesReps() {
  const [salesReps, setSalesReps] = useState(mockSalesReps);
  const [loading, setLoading] = useState(false);

  return {
    salesReps,
    loading
  };
}

export function useOMSProducts() {
  const [products, setProducts] = useState(mockProducts);
  const [loading, setLoading] = useState(false);

  const searchProducts = async (query: string) => {
    return products.filter(p => 
      p.sku.toLowerCase().includes(query.toLowerCase()) ||
      p.title.toLowerCase().includes(query.toLowerCase())
    );
  };

  return {
    products,
    loading,
    searchProducts
  };
}

export function useOMSOrders() {
  const [orders, setOrders] = useState(mockOrders);
  const [loading, setLoading] = useState(false);

  const createOrder = async (data: any) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simular criação completa do pedido
      const newOrder = {
        ...data,
        id: Date.now().toString(),
        number: `${String(orders.length + 1).padStart(6, '0')}/2025`,
        status: "draft" as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        oms_customers: mockCustomers.find(c => c.id === data.customer_id),
        oms_sales_reps: mockSalesReps.find(r => r.id === data.sales_rep_id),
        oms_order_items: data.items
      };
      
      setOrders([newOrder, ...orders]);
      return newOrder;
    } finally {
      setLoading(false);
    }
  };

  const approveOrder = async (id: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
        setOrders(orders.map(o => 
        o.id === id ? { 
          ...o, 
          status: "approved" as OrderStatus, 
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        } : o
      ));
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (id: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
        setOrders(orders.map(o => 
        o.id === id ? { 
          ...o, 
          status: "cancelled" as OrderStatus,
          updated_at: new Date().toISOString() 
        } : o
      ));
    } finally {
      setLoading(false);
    }
  };

  return {
    orders,
    loading,
    createOrder,
    approveOrder,
    cancelOrder
  };
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'draft': return 'bg-yellow-100 text-yellow-800';
    case 'approved': return 'bg-blue-100 text-blue-800';
    case 'invoiced': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function getPriceTierMultiplier(tier: 'standard' | 'premium' | 'vip'): number {
  switch (tier) {
    case 'standard': return 1.0;
    case 'premium': return 0.95;
    case 'vip': return 0.90;
    default: return 1.0;
  }
}