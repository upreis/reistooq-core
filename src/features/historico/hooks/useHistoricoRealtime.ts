import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { HistoricoDataService } from "@/features/historico/services/HistoricoDataService";

type Opts = { enabled?: boolean };

export function useHistoricoRealtime({ enabled = false }: Opts) {
  const qc = useQueryClient();
  const subscribedRef = useRef(false);
  const lastInvalidateRef = useRef(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const toastOnceRef = useRef(false); // se existir toast, mostrar 1x só

  useEffect(() => {
    if (!enabled || subscribedRef.current) return;

    const channel = supabase
      .channel("rt-historico-vendas")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "historico_vendas" },
        () => {
          const now = Date.now();
          // throttle: no máx. 1 invalidação por segundo
          if (now - lastInvalidateRef.current > 1000) {
            lastInvalidateRef.current = now;
            // Invalida cache interno do serviço + react-query
            try { HistoricoDataService.invalidateCache(); } catch (_) {}
            qc.invalidateQueries({ queryKey: ["historico-vendas"] });
            qc.invalidateQueries({ queryKey: ["historico"] }); // fallback
            qc.invalidateQueries({ queryKey: ["historico-simple"] });
            qc.invalidateQueries({ queryKey: ["historico-stats"] });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && !toastOnceRef.current) {
          toastOnceRef.current = true;
          // opcional: toast({ title: "Conexão em tempo real ativada" })
        }
      });

    subscribedRef.current = true;
    channelRef.current = channel;

    // cleanup ao desmontar/trocar de página
    return () => {
      channelRef.current?.unsubscribe();
      channelRef.current = null;
      subscribedRef.current = false;
      toastOnceRef.current = false;
    };
  }, [enabled, qc]);
}