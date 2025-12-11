import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VendaHoje {
  total_amount: number;
  account_name: string | null;
}

interface VendasHojeCardProps {
  selectedAccount?: string;
}

export function VendasHojeCard({ selectedAccount = "todas" }: VendasHojeCardProps) {
  const [totalVendas, setTotalVendas] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Buscar total de vendas do dia
  useEffect(() => {
    const fetchTotalVendas = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('organizacao_id')
          .eq('id', user.id)
          .single();

        if (!profile?.organizacao_id) return;

        const { data, error } = await supabase
          .from('vendas_hoje_realtime')
          .select('total_amount, account_name')
          .eq('organization_id', profile.organizacao_id);

        if (error) throw error;

        // Filtrar por conta se não for "todas"
        const filteredData = selectedAccount === "todas" 
          ? data || []
          : (data || []).filter((v: VendaHoje) => v.account_name === selectedAccount);

        const total = filteredData.reduce((acc: number, v: VendaHoje) => acc + (v.total_amount || 0), 0);
        setTotalVendas(total);
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
  }, [selectedAccount]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formattedDate = format(currentTime, "d 'de' MMMM, HH:mm:ss", { locale: ptBR });

  return (
    <motion.div
      className="md:col-span-3 md:row-span-1 bg-background border border-border rounded-xl p-4 flex flex-col hover:border-primary/50 transition-colors cursor-pointer overflow-hidden relative"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Header com título amarelo */}
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-[#FFE600] drop-shadow-sm">
          Vendas de hoje ao vivo
        </h2>
      </div>

      {/* Badge de data/hora */}
      <div className="flex justify-center mb-3">
        <div className="bg-[#FFE600] text-black px-3 py-1 rounded-full text-xs font-medium">
          {formattedDate}
        </div>
      </div>

      {/* Valor total */}
      <div className="flex-1 flex items-center justify-center">
        {isLoading ? (
          <div className="h-12 w-40 bg-foreground/10 rounded animate-pulse" />
        ) : (
          <motion.div
            className="text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <span className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              {formatCurrency(totalVendas)}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
