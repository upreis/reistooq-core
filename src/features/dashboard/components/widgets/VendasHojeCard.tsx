import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { ViewMode } from "./FeaturesBentoGrid";

interface VendasHojeCardProps {
  selectedAccount?: string;
  dateRange: { start: Date; end: Date };
  viewMode: ViewMode;
}

export function VendasHojeCard({ selectedAccount = "todas", dateRange, viewMode }: VendasHojeCardProps) {
  const [totalVendas, setTotalVendas] = useState(0);
  const [totalVendasMes, setTotalVendasMes] = useState(0);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  // ✅ FASE 2.1: Refs para debounce e controle de fetch
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Range do mês atual (dia 1 até hoje) - usado para comparação
  const currentMonthRange = React.useMemo(() => ({
    start: startOfMonth(new Date()),
    end: endOfDay(new Date())
  }), []);

  // ✅ FASE 2.2: Montar após hidratação para evitar React Error #419
  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());
  }, []);

  // Atualizar relógio a cada segundo (apenas após montagem)
  useEffect(() => {
    if (!isMounted) return;
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [isMounted]);

  // Converter datas para strings com timezone São Paulo
  const dateStartISO = formatInTimeZone(dateRange.start, 'America/Sao_Paulo', "yyyy-MM-dd'T'00:00:00XXX");
  const dateEndISO = formatInTimeZone(dateRange.end, 'America/Sao_Paulo', "yyyy-MM-dd'T'23:59:59XXX");

  // ✅ FASE 2.1: Função de fetch otimizada com debounce interno
  const fetchTotalVendas = useCallback(async () => {
    // Evitar múltiplas chamadas concorrentes
    if (isFetchingRef.current) {
      return;
    }
    
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    isFetchingRef.current = true;
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        isFetchingRef.current = false;
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organizacao_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.organizacao_id) {
        setIsLoading(false);
        isFetchingRef.current = false;
        return;
      }

      const organizationId = profile.organizacao_id;

      // ✅ OTIMIZAÇÃO: Buscar em paralelo período selecionado + mês atual
      const monthStartISO = formatInTimeZone(currentMonthRange.start, 'America/Sao_Paulo', "yyyy-MM-dd'T'00:00:00XXX");
      const monthEndISO = formatInTimeZone(currentMonthRange.end, 'America/Sao_Paulo', "yyyy-MM-dd'T'23:59:59XXX");

      // Função auxiliar para somar todas as páginas
      const fetchAllPages = async (startDate: string, endDate: string): Promise<number> => {
        let total = 0;
        let offset = 0;
        const pageSize = 1000;
        let hasMore = true;
        const maxPages = 50; // Limite de segurança
        let pageCount = 0;

        while (hasMore && pageCount < maxPages) {
          let query = supabase
            .from('vendas_hoje_realtime')
            .select('total_amount')
            .eq('organization_id', organizationId)
            .gte('date_created', startDate)
            .lte('date_created', endDate)
            .range(offset, offset + pageSize - 1);

          if (selectedAccount !== "todas") {
            query = query.eq('account_name', selectedAccount);
          }

          const { data, error } = await query;

          if (error) {
            console.error('[VendasHojeCard] Erro na query:', error);
            break;
          }

          const pageTotal = (data || []).reduce((acc, v) => acc + (v.total_amount || 0), 0);
          total += pageTotal;

          hasMore = (data?.length || 0) === pageSize;
          offset += pageSize;
          pageCount++;
        }

        return total;
      };

      // Executar ambas queries em paralelo
      const [periodoTotal, mesTotal] = await Promise.all([
        fetchAllPages(dateStartISO, dateEndISO),
        fetchAllPages(monthStartISO, monthEndISO)
      ]);

      setTotalVendas(periodoTotal);
      setTotalVendasMes(mesTotal);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('[VendasHojeCard] Erro ao buscar vendas:', error);
      }
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [selectedAccount, dateStartISO, dateEndISO, currentMonthRange]);

  // ✅ FASE 2.1: Função de debounce para Realtime
  const debouncedFetch = useCallback(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    fetchTimeoutRef.current = setTimeout(() => {
      fetchTotalVendas();
    }, 500); // 500ms debounce
  }, [fetchTotalVendas]);

  // Effect principal para fetch inicial e subscription
  useEffect(() => {
    fetchTotalVendas();

    // ✅ FASE 2.1: Realtime com debounce para evitar fetch storm
    const channel = supabase
      .channel('vendas-hoje-realtime-card')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // ✅ Apenas INSERT, não UPDATE (evita duplicatas)
          schema: 'public',
          table: 'vendas_hoje_realtime'
        },
        () => {
          debouncedFetch();
        }
      )
      .subscribe();

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      supabase.removeChannel(channel);
    };
  }, [fetchTotalVendas, debouncedFetch]);

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
      // ✅ FASE 2.2: Só verificar "hoje" após montagem (evita mismatch)
      if (!isMounted || !currentTime) {
        return "Vendas do dia"; // Título seguro antes de montar
      }
      const isToday = dateRange.start.toDateString() === currentTime.toDateString();
      return isToday ? "Vendas de hoje ao vivo" : "Vendas do dia";
    }
    return "Vendas do mês";
  };

  // Badge com data/período selecionado
  const getBadgeText = () => {
    // ✅ FASE 2.2: Não renderizar tempo dinâmico até montar (evita Error #419)
    if (!isMounted || !currentTime) {
      return format(dateRange.start, "d 'de' MMMM, yyyy", { locale: ptBR });
    }
    
    if (viewMode === "day") {
      const isToday = dateRange.start.toDateString() === currentTime.toDateString();
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
