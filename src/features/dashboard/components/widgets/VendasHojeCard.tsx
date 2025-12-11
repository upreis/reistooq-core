import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
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

  // Range do mês atual (dia 1 até hoje) - usado apenas quando viewMode é "day"
  const currentMonthRange = React.useMemo(() => ({
    start: startOfMonth(new Date()),
    end: endOfDay(new Date())
  }), []);

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Converter datas para strings com timezone São Paulo (evita problemas de UTC)
  // Formato: YYYY-MM-DDTHH:mm:ss-03:00
  const dateStartISO = formatInTimeZone(dateRange.start, 'America/Sao_Paulo', "yyyy-MM-dd'T'00:00:00XXX");
  const dateEndISO = formatInTimeZone(dateRange.end, 'America/Sao_Paulo', "yyyy-MM-dd'T'23:59:59XXX");

  // Buscar total de vendas do período selecionado usando agregação no servidor
  // IMPORTANTE: Supabase tem limite de 1000 rows, então usamos múltiplas páginas ou COUNT
  useEffect(() => {
    let isCancelled = false;
    
    const fetchTotalVendas = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || isCancelled) {
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('organizacao_id')
          .eq('id', user.id)
          .single();

        if (!profile?.organizacao_id || isCancelled) {
          setIsLoading(false);
          return;
        }

        // Buscar vendas do período selecionado - usando paginação para evitar limite de 1000
        let total = 0;
        let offset = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore && !isCancelled) {
          let query = supabase
            .from('vendas_hoje_realtime')
            .select('total_amount')
            .eq('organization_id', profile.organizacao_id)
            .gte('date_created', dateStartISO)
            .lte('date_created', dateEndISO)
            .range(offset, offset + pageSize - 1);

          if (selectedAccount !== "todas") {
            query = query.eq('account_name', selectedAccount);
          }

          const { data, error } = await query;

          if (error || isCancelled) {
            if (error) console.error('[VendasHojeCard] Erro na query:', error);
            break;
          }

          const pageTotal = (data || []).reduce((acc, v) => acc + (v.total_amount || 0), 0);
          total += pageTotal;

          hasMore = (data?.length || 0) === pageSize;
          offset += pageSize;
        }

        if (!isCancelled) setTotalVendas(total);

        // Buscar vendas do mês atual (sempre - para comparação) - também com paginação
        const monthStartISO = formatInTimeZone(currentMonthRange.start, 'America/Sao_Paulo', "yyyy-MM-dd'T'00:00:00XXX");
        const monthEndISO = formatInTimeZone(currentMonthRange.end, 'America/Sao_Paulo', "yyyy-MM-dd'T'23:59:59XXX");
        
        let totalMes = 0;
        offset = 0;
        hasMore = true;

        while (hasMore && !isCancelled) {
          let queryMes = supabase
            .from('vendas_hoje_realtime')
            .select('total_amount')
            .eq('organization_id', profile.organizacao_id)
            .gte('date_created', monthStartISO)
            .lte('date_created', monthEndISO)
            .range(offset, offset + pageSize - 1);

          if (selectedAccount !== "todas") {
            queryMes = queryMes.eq('account_name', selectedAccount);
          }

          const { data: dataMes, error: errorMes } = await queryMes;

          if (errorMes || isCancelled) {
            if (errorMes) console.error('[VendasHojeCard] Erro na query mês:', errorMes);
            break;
          }

          const pageTotalMes = (dataMes || []).reduce((acc, v) => acc + (v.total_amount || 0), 0);
          totalMes += pageTotalMes;

          hasMore = (dataMes?.length || 0) === pageSize;
          offset += pageSize;
        }

        if (!isCancelled) setTotalVendasMes(totalMes);
      } catch (error) {
        if (!isCancelled) console.error('[VendasHojeCard] Erro ao buscar vendas:', error);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchTotalVendas();

    // Subscription Realtime para atualizações instantâneas
    const channel = supabase
      .channel('vendas-hoje-realtime-card')
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
      isCancelled = true;
      supabase.removeChannel(channel);
    };
  }, [selectedAccount, dateStartISO, dateEndISO, currentMonthRange]);

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
      className="bg-background border border-muted-foreground/30 rounded-xl p-6 hover:bg-accent/10 transition-all flex-shrink-0 relative mt-4"
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

      {/* Conteúdo baseado no viewMode */}
      <div className="flex gap-4 pt-2">
        {/* Card Vendas do Período Selecionado - sempre presente */}
        <div className={`flex flex-col items-center justify-center text-center ${viewMode === "month" ? "flex-1" : "flex-1"}`}>
          <h2 className="text-sm font-semibold text-primary mb-1">
            {getTitle()}
          </h2>
          {isLoading ? (
            <div className="h-8 w-32 bg-foreground/10 rounded animate-pulse" />
          ) : (
            <span className="text-2xl font-bold text-foreground tracking-tight">
              {formatCurrency(totalVendas)}
            </span>
          )}
        </div>

        {/* Divisor e Card do Mês Atual - sempre visível para comparação */}
        <div className="w-px bg-border" />
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h2 className="text-sm font-semibold text-muted-foreground mb-1">
            Vendas deste mês
          </h2>
          {isLoading ? (
            <div className="h-8 w-32 bg-foreground/10 rounded animate-pulse" />
          ) : (
            <span className="text-2xl font-bold text-foreground tracking-tight">
              {formatCurrency(totalVendasMes)}
            </span>
          )}
          <span className="text-xs text-muted-foreground mt-1">
            {format(currentMonthRange.start, "dd/MM", { locale: ptBR })} - {format(currentMonthRange.end, "dd/MM", { locale: ptBR })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
