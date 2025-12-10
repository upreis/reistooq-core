import React, { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const COLORS = [
  "hsl(221, 83%, 53%)", // blue
  "hsl(340, 82%, 52%)", // pink/magenta
  "hsl(142, 71%, 45%)", // green
  "hsl(38, 92%, 50%)",  // orange
  "hsl(262, 83%, 58%)", // purple
  "hsl(199, 89%, 48%)", // cyan
];

interface VendaRealtime {
  id: string;
  integration_account_id: string;
  account_name: string | null;
  order_id: string;
  total_amount: number | null;
  date_created: string | null;
  created_at: string;
}

interface ChartDataPoint {
  hora: string;
  [key: string]: string | number;
}

interface TendenciaVendasChartProps {
  selectedAccount?: string;
}

export function TendenciaVendasChart({ selectedAccount = "todas" }: TendenciaVendasChartProps) {
  const { data: vendas = [] } = useQuery({
    queryKey: ["vendas-hoje-tendencia"],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("vendas_hoje_realtime")
        .select("*")
        .gte("date_created", hoje);

      if (error) throw error;
      return (data || []) as VendaRealtime[];
    },
    refetchInterval: 60000,
  });

  const { chartData, filteredAccounts } = useMemo(() => {
    if (!vendas || vendas.length === 0) {
      console.log("[TendenciaVendasChart] Sem vendas disponíveis");
      return { chartData: [], filteredAccounts: [] };
    }

    console.log("[TendenciaVendasChart] Processando vendas:", vendas.length);

    const accountsSet = new Set<string>();
    const horaMap = new Map<string, Map<string, number>>();

    vendas.forEach((venda) => {
      const accountName = venda.account_name || "Desconhecido";
      accountsSet.add(accountName);

      const dateStr = venda.date_created || venda.created_at;
      if (!dateStr) {
        console.log("[TendenciaVendasChart] Venda sem data:", venda);
        return;
      }
      
      const date = new Date(dateStr);
      const hora = date.getHours().toString().padStart(2, "0");
      const valor = Number(venda.total_amount) || 0;

      if (!horaMap.has(hora)) {
        horaMap.set(hora, new Map());
      }
      
      const horaData = horaMap.get(hora)!;
      const current = horaData.get(accountName) || 0;
      horaData.set(accountName, current + valor);
    });

    const accounts = Array.from(accountsSet);
    const filteredAccounts = selectedAccount === "todas" 
      ? accounts 
      : accounts.filter(a => a === selectedAccount);
    
    console.log("[TendenciaVendasChart] Contas encontradas:", accounts);
    console.log("[TendenciaVendasChart] Contas filtradas:", filteredAccounts);
    console.log("[TendenciaVendasChart] Horas com dados:", Array.from(horaMap.keys()));

    const chartData: ChartDataPoint[] = [];

    horaMap.forEach((accountData, hora) => {
      const point: ChartDataPoint = { hora: `${hora}h` };
      filteredAccounts.forEach((account) => {
        point[account] = accountData.get(account) || 0;
      });
      chartData.push(point);
    });

    chartData.sort((a, b) => {
      const horaA = parseInt(a.hora.replace('h', ''));
      const horaB = parseInt(b.hora.replace('h', ''));
      return horaA - horaB;
    });

    console.log("[TendenciaVendasChart] chartData FINAL:", chartData);
    console.log("[TendenciaVendasChart] Exemplo primeiro ponto:", chartData[0]);

    return { chartData, filteredAccounts };
  }, [vendas, selectedAccount]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)} mil`;
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-2">{label}h - Vendas brutas</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="font-semibold text-foreground ml-auto">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // DADOS DE TESTE FIXOS para verificar se o gráfico funciona
  const testData = [
    { hora: '06h', vendas: 100 },
    { hora: '07h', vendas: 250 },
    { hora: '08h', vendas: 400 },
    { hora: '09h', vendas: 600 },
    { hora: '10h', vendas: 500 },
    { hora: '11h', vendas: 350 },
    { hora: '12h', vendas: 200 },
  ];

  return (
    <div className="md:col-span-2 md:row-span-2 bg-background border border-border rounded-xl p-4">
      <h3 className="font-serif text-lg text-foreground font-medium mb-4">
        Tendências em vendas brutas (TESTE)
      </h3>
      
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={testData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
            <XAxis dataKey="hora" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip />
            <Legend />
            <Bar dataKey="vendas" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <p className="text-muted-foreground text-xs mt-2">
        Dados de teste - se este gráfico aparecer, o Recharts funciona
      </p>
    </div>
  );
}
