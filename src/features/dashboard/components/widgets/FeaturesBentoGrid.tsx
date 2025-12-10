import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Smartphone } from "lucide-react";
import { VendasHojeCard } from "./VendasHojeCard";
import { TendenciaVendasChart } from "./TendenciaVendasChart";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const ACCOUNT_COLORS: Record<string, string> = {
  "BRCR20240514161447": "border-blue-500 bg-blue-500",
  "PLATINUMLOJA2020": "border-pink-500 bg-pink-500",
  "UNIVERSOMELI": "border-green-500 bg-green-500",
  "HORE20240106205039": "border-orange-500 bg-orange-500",
  "LOJAOITO": "border-purple-500 bg-purple-500",
  "LUTHORSHOPLTDA": "border-cyan-500 bg-cyan-500",
};

function LayoutAnimation() {
  const [layout, setLayout] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLayout((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const layouts = ["grid-cols-2", "grid-cols-3", "grid-cols-1"];

  return (
    <div className="h-full flex items-center justify-center">
      <motion.div
        className={`grid ${layouts[layout]} gap-1.5 w-full max-w-[140px] h-full`}
        layout
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="bg-foreground/20 rounded-md h-5 w-full"
            layout
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </motion.div>
    </div>
  );
}

function SpeedIndicator() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="h-10 flex items-center justify-center overflow-hidden relative w-full">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              className="h-8 w-24 bg-foreground/10 rounded"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              exit={{ opacity: 0, y: -20, position: "absolute" }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          ) : (
            <motion.span
              key="text"
              initial={{ y: 20, opacity: 0, filter: "blur(5px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              className="text-3xl md:text-4xl font-sans font-medium text-foreground"
            >
              100ms
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <span className="text-sm text-muted-foreground">Load Time</span>
      <div className="w-full max-w-[120px] h-1.5 bg-foreground/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-foreground rounded-full"
          initial={{ width: 0 }}
          animate={{ width: loading ? 0 : "100%" }}
          transition={{ type: "spring", stiffness: 100, damping: 15, mass: 1 }}
        />
      </div>
    </div>
  );
}

function SecurityBadge() {
  const [shields, setShields] = useState([
    { id: 1, active: false },
    { id: 2, active: false },
    { id: 3, active: false },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setShields((prev) => {
        const nextIndex = prev.findIndex((s) => !s.active);
        if (nextIndex === -1) {
          return prev.map(() => ({ id: Math.random(), active: false }));
        }
        return prev.map((s, i) =>
          i === nextIndex ? { ...s, active: true } : s
        );
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center h-full gap-2">
      {shields.map((shield) => (
        <motion.div
          key={shield.id}
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            shield.active ? "bg-foreground/20" : "bg-foreground/5"
          }`}
          animate={{ scale: shield.active ? 1.1 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Lock
            className={`w-5 h-5 ${
              shield.active ? "text-foreground" : "text-muted-foreground"
            }`}
          />
        </motion.div>
      ))}
    </div>
  );
}

export function FeaturesBentoGrid() {
  const [selectedAccount, setSelectedAccount] = useState<string>("todas");

  // Fetch available accounts from vendas_hoje_realtime
  const { data: accounts = [] } = useQuery({
    queryKey: ["vendas-hoje-accounts"],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("vendas_hoje_realtime")
        .select("account_name")
        .gte("date_created", hoje);

      if (error) throw error;
      
      const uniqueAccounts = [...new Set((data || []).map(d => d.account_name).filter(Boolean))];
      return uniqueAccounts as string[];
    },
    refetchInterval: 60000,
  });

  const getAccountColor = (account: string, isActive: boolean) => {
    const colorKey = Object.keys(ACCOUNT_COLORS).find(key => 
      account.toLowerCase().includes(key.toLowerCase()) || 
      key.toLowerCase().includes(account.toLowerCase())
    );
    const baseColor = colorKey ? ACCOUNT_COLORS[colorKey] : "border-gray-500 bg-gray-500";
    const [borderClass, bgClass] = baseColor.split(" ");
    
    if (isActive) {
      return `${bgClass} text-white ${borderClass}`;
    }
    return `bg-background ${borderClass} hover:bg-accent`;
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <div className="flex gap-2 items-center flex-wrap py-3 px-4 bg-background/50 rounded-lg border border-border">
        <span className="text-xs text-muted-foreground font-medium">Filtrar por:</span>
        <button
          onClick={() => setSelectedAccount("todas")}
          className={`px-3 py-1.5 text-xs rounded-full border-2 transition-all font-medium ${
            selectedAccount === "todas"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border hover:bg-accent"
          }`}
        >
          Todos
        </button>
        {accounts.map((account) => (
          <button
            key={account}
            onClick={() => setSelectedAccount(account)}
            className={`px-3 py-1.5 text-xs rounded-full border-2 transition-all font-medium ${
              getAccountColor(account, selectedAccount === account)
            }`}
          >
            🏪 {account}
          </button>
        ))}
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[200px]">
        {/* 1. Vendas de Hoje ao Vivo - Tall (2x2) */}
        <VendasHojeCard selectedAccount={selectedAccount} />

        {/* 2. Layouts - Standard (2x1) */}
        <motion.div
          className="md:col-span-2 bg-background border border-border rounded-xl p-8 flex flex-col hover:border-primary/50 transition-colors cursor-pointer overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 0.98 }}
        >
          <div className="flex-1">
            <LayoutAnimation />
          </div>
          <div className="mt-4">
            <h3 className="font-serif text-xl text-foreground font-medium">
              Layouts
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              Flexible grids that adapt.
            </p>
          </div>
        </motion.div>

        {/* 3. Tendência de Vendas - Tall (2x2) */}
        <TendenciaVendasChart selectedAccount={selectedAccount} />

        {/* 4. Speed - Standard (2x1) */}
        <motion.div
          className="md:col-span-2 bg-background border border-border rounded-xl p-8 flex flex-col hover:border-primary/50 transition-colors cursor-pointer overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 0.98 }}
        >
          <div className="flex-1">
            <SpeedIndicator />
          </div>
          <div className="mt-4">
            <h3 className="font-serif text-xl text-foreground font-medium">
              Speed
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              Blazing fast performance.
            </p>
          </div>
        </motion.div>

        {/* 5. Security - Wide (3x1) */}
        <motion.div
          className="md:col-span-3 bg-background border border-border rounded-xl p-8 flex flex-col hover:border-primary/50 transition-colors cursor-pointer overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 0.98 }}
        >
          <div className="flex-1">
            <SecurityBadge />
          </div>
          <div className="mt-4">
            <h3 className="font-serif text-xl text-foreground flex items-center gap-2 font-medium">
              <Lock className="w-5 h-5" />
              Security First
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              Enterprise-grade encryption and data protection built-in.
            </p>
          </div>
        </motion.div>

        {/* 6. Mobile Responsive - Wide (3x1) */}
        <motion.div
          className="md:col-span-3 bg-background border border-border rounded-xl p-8 flex flex-col hover:border-primary/50 transition-colors cursor-pointer overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 0.98 }}
        >
          <div className="flex-1 flex items-center justify-center">
            <Smartphone className="w-16 h-16 text-foreground" />
          </div>
          <div className="mt-4">
            <h3 className="font-serif text-xl text-foreground font-medium">
              Mobile Ready
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              Optimized for all devices and screen sizes.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
