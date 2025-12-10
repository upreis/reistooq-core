import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Calendar } from "lucide-react";
import {
  LineChart,
  Line,
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

export function TendenciaVendasChart() {
  const { data: vendas = [] } = useQuery({
    queryKey: ["vendas-hoje-tendencia"],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("vendas_hoje_realtime")
        .select("*")
        .gte("order_date", hoje);

      if (error) throw error;
      return (data || []) as VendaRealtime[];
    },
    refetchInterval: 60000,
  });

  const { chartData, accounts } = useMemo(() => {
    const accountsMap = new Map<string, string>();
    const horaMap = new Map<string, Map<string, number>>();

    // Initialize hours 00-23
    for (let i = 0; i < 24; i++) {
      const hora = i.toString().padStart(2, "0");
      horaMap.set(hora, new Map());
    }

    vendas.forEach((venda) => {
      const accountName = venda.account_name || "Desconhecido";
      accountsMap.set(venda.integration_account_id, accountName);

      const date = new Date(venda.date_created || venda.created_at);
      const hora = date.getHours().toString().padStart(2, "0");

      const horaData = horaMap.get(hora);
      if (horaData) {
        const current = horaData.get(accountName) || 0;
        horaData.set(accountName, current + (venda.total_amount || 0));
      }
    });

    const accounts = Array.from(accountsMap.values());
    const chartData: ChartDataPoint[] = [];

    horaMap.forEach((accountData, hora) => {
      const point: ChartDataPoint = { hora };
      accounts.forEach((account) => {
        point[account] = accountData.get(account) || 0;
      });
      chartData.push(point);
    });

    chartData.sort((a, b) => a.hora.localeCompare(b.hora));

    return { chartData, accounts };
  }, [vendas]);

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
        <p className="font-medium text-foreground mb-2">Vendas brutas</p>
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

  return (
    <motion.div
      className="md:col-span-2 md:row-span-2 bg-background border border-border rounded-xl p-4 flex flex-col hover:border-primary/50 transition-colors overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-serif text-lg text-foreground font-medium">
          Tendências em vendas brutas
        </h3>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="hora"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              label={{
                value: "Horas",
                position: "bottom",
                offset: -5,
                style: { fill: "hsl(var(--muted-foreground))", fontSize: 11 },
              }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
              label={{
                value: "Vendas (R$)",
                angle: -90,
                position: "insideLeft",
                offset: 10,
                style: { fill: "hsl(var(--muted-foreground))", fontSize: 11 },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ fontSize: 11, paddingBottom: 10 }}
            />
            {accounts.map((account, index) => (
              <Line
                key={account}
                type="monotone"
                dataKey={account}
                name={account}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3, fill: COLORS[index % COLORS.length] }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-border">
        <p className="text-muted-foreground text-xs flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Vendas por hora do dia atual
        </p>
      </div>
    </motion.div>
  );
}
