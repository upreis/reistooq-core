import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ViewMode } from "./FeaturesBentoGrid";

interface VendaHoje {
  total_amount: number;
  account_name: string | null;
}

interface VendasHojeCardProps {
  selectedAccount?: string;
  dateRange: { start: Date; end: Date };
  viewMode: ViewMode;
}

export function VendasHojeCard({ selectedAccount = "todas", dateRange, viewMode }: VendasHojeCardProps) {
  const [totalVendas, setTotalVendas] = useState(0);
  const [totalVendasMes, setTotalVendasMes] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Range do mês atual (dia 1 até hoje)
  const monthRange = {
    start: startOfMonth(new Date()),
    end: endOfDay(new Date())
  };

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Buscar total de vendas do período selecionado
  useEffect(() => {
    const fetchTotalVendas = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('organizacao_id')
          .eq('id', user.id)
          .single();

        if (!profile?.organizacao_id) return;

        // Buscar vendas do período selecionado
        const { data, error } = await supabase
          .from('vendas_hoje_realtime')
          .select('total_amount, account_name')
          .eq('organization_id', profile.organizacao_id)
          .gte('date_created', dateRange.start.toISOString())
          .lte('date_created', dateRange.end.toISOString());

        if (error) throw error;

        // Buscar vendas do mês atual
        const { data: dataMes, error: errorMes } = await supabase
          .from('vendas_hoje_realtime')
          .select('total_amount, account_name')
          .eq('organization_id', profile.organizacao_id)
          .gte('date_created', monthRange.start.toISOString())
          .lte('date_created', monthRange.end.toISOString());

        if (errorMes) throw errorMes;

        // Filtrar por conta se não for "todas"
        const filteredData = selectedAccount === "todas" 
          ? data || []
          : (data || []).filter((v: VendaHoje) => v.account_name === selectedAccount);

        const filteredDataMes = selectedAccount === "todas" 
          ? dataMes || []
          : (dataMes || []).filter((v: VendaHoje) => v.account_name === selectedAccount);

        const total = filteredData.reduce((acc: number, v: VendaHoje) => acc + (v.total_amount || 0), 0);
        const totalMes = filteredDataMes.reduce((acc: number, v: VendaHoje) => acc + (v.total_amount || 0), 0);
        
        setTotalVendas(total);
        setTotalVendasMes(totalMes);
      } catch (error) {
        console.error('Erro ao buscar vendas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTotalVendas();

    // Subscription Realtime para atualizações instantâneas
    const channel = supabase
      .channel('vendas-hoje-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendas_hoje_realtime'
        },
        () => {
          fetchTotalVendas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedAccount, dateRange.start, dateRange.end]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Título dinâmico baseado no período
  const getTitle = () => {
    if (viewMode === "day") {
      const isToday = dateRange.start.toDateString() === new Date().toDateString();
      return isToday ? "Vendas de hoje ao vivo" : `Vendas do dia`;
    }
    return `Vendas do mês`;
  };

  // Badge com data/período selecionado
  const getBadgeText = () => {
    if (viewMode === "day") {
      const isToday = dateRange.start.toDateString() === new Date().toDateString();
      if (isToday) {
        return format(currentTime, "d 'de' MMMM, HH:mm:ss", { locale: ptBR });
      }
      return format(dateRange.start, "d 'de' MMMM, yyyy", { locale: ptBR });
    }
    return format(dateRange.start, "MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <motion.div
      className="bg-background border border-border rounded-xl p-6 hover:bg-accent/10 transition-all flex-shrink-0 relative mt-4"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {/* Badge de data - posicionado no topo, metade dentro/fora */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shadow-md">
          {getBadgeText()}
        </span>
      </div>

      {/* Dois cards lado a lado */}
      <div className="flex gap-4 pt-2">
        {/* Card Vendas do Período Selecionado */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h2 className="text-sm font-semibold text-primary mb-1">
            {getTitle()}
          </h2>
          {isLoading ? (
            <div className="h-8 w-32 bg-foreground/10 rounded animate-pulse" />
          ) : (
            <motion.span
              key={totalVendas}
              className="text-2xl font-bold text-foreground tracking-tight"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              {formatCurrency(totalVendas)}
            </motion.span>
          )}
        </div>

        {/* Divisor vertical */}
        <div className="w-px bg-border" />

        {/* Card Vendas do Mês */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h2 className="text-sm font-semibold text-muted-foreground mb-1">
            Vendas deste mês
          </h2>
          {isLoading ? (
            <div className="h-8 w-32 bg-foreground/10 rounded animate-pulse" />
          ) : (
            <motion.span
              key={totalVendasMes}
              className="text-2xl font-bold text-foreground tracking-tight"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              {formatCurrency(totalVendasMes)}
            </motion.span>
          )}
          <span className="text-xs text-muted-foreground mt-1">
            {format(monthRange.start, "dd/MM", { locale: ptBR })} - {format(monthRange.end, "dd/MM", { locale: ptBR })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
