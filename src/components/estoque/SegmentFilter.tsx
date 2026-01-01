/**
 * 🏷️ FILTRO DE SEGMENTOS - Estoque Grid View
 * Chips animados para filtrar produtos por categoria/segmento
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, X, Filter, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product } from "@/hooks/useProducts";

interface SegmentFilterProps {
  products: Product[];
  selectedSegments: string[];
  onSegmentChange: (segments: string[]) => void;
  className?: string;
}

interface SegmentCount {
  name: string;
  count: number;
}

// Paleta de cores para os segmentos (cicla entre elas)
const SEGMENT_COLORS = [
  "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
  "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
  "bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30",
  "bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30",
  "bg-pink-500/10 text-pink-600 border-pink-500/20 hover:bg-pink-500/20 dark:bg-pink-500/20 dark:text-pink-400 dark:border-pink-500/30",
  "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 hover:bg-cyan-500/20 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/30",
  "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30",
  "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 hover:bg-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30",
];

const SEGMENT_SELECTED_COLORS = [
  "bg-blue-500 text-white border-blue-600 shadow-md dark:bg-blue-600",
  "bg-green-500 text-white border-green-600 shadow-md dark:bg-green-600",
  "bg-purple-500 text-white border-purple-600 shadow-md dark:bg-purple-600",
  "bg-orange-500 text-white border-orange-600 shadow-md dark:bg-orange-600",
  "bg-pink-500 text-white border-pink-600 shadow-md dark:bg-pink-600",
  "bg-cyan-500 text-white border-cyan-600 shadow-md dark:bg-cyan-600",
  "bg-yellow-500 text-white border-yellow-600 shadow-md dark:bg-yellow-600",
  "bg-indigo-500 text-white border-indigo-600 shadow-md dark:bg-indigo-600",
];

export function SegmentFilter({
  products,
  selectedSegments,
  onSegmentChange,
  className,
}: SegmentFilterProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Extrair segmentos únicos dos produtos com contagem
  const segments = useMemo<SegmentCount[]>(() => {
    const segmentMap = new Map<string, number>();

    products.forEach((product) => {
      // Priorizar categoria_principal, depois categoria, depois "Sem Categoria"
      const segment =
        product.categoria_principal ||
        product.categoria ||
        "Sem Categoria";

      segmentMap.set(segment, (segmentMap.get(segment) || 0) + 1);
    });

    // Ordenar por contagem (maior primeiro), depois alfabeticamente
    return Array.from(segmentMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });
  }, [products]);

  const isAllSelected = selectedSegments.length === 0;

  const handleToggleSegment = (segmentName: string) => {
    if (selectedSegments.includes(segmentName)) {
      // Remove do filtro
      onSegmentChange(selectedSegments.filter((s) => s !== segmentName));
    } else {
      // Adiciona ao filtro
      onSegmentChange([...selectedSegments, segmentName]);
    }
  };

  const handleSelectAll = () => {
    onSegmentChange([]);
  };

  const handleClearFilters = () => {
    onSegmentChange([]);
  };

  const getColorForIndex = (index: number, isSelected: boolean) => {
    const colorIndex = index % SEGMENT_COLORS.length;
    return isSelected ? SEGMENT_SELECTED_COLORS[colorIndex] : SEGMENT_COLORS[colorIndex];
  };

  if (segments.length <= 1) {
    // Não mostrar se só tem um segmento
    return null;
  }

  return (
    <div className={cn("bg-card/30 overflow-hidden", className)}>
      {/* Chips de segmentos - sempre visíveis, sem header */}
      <div className="flex md:flex-wrap gap-1 md:gap-1.5 px-0 py-2 md:py-3 overflow-x-auto md:overflow-x-visible scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {/* Botão "Todos" */}
              <motion.button
                layout
                onClick={handleSelectAll}
                className={cn(
                  "compact inline-flex items-center gap-1.5 px-2.5 py-[2px] rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0 border",
                  isAllSelected
                    ? "bg-secondary text-secondary-foreground border-secondary shadow-sm"
                    : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary/80 hover:text-foreground"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Todos
                <span className={cn(
                  "text-xs font-semibold",
                  isAllSelected ? "opacity-80" : "opacity-70"
                )}>
                  {products.length}
                </span>
              </motion.button>

              {/* Chips dos segmentos */}
              {segments.map((segment, index) => {
                const isSelected = selectedSegments.includes(segment.name);
                const colorClasses = getColorForIndex(index, isSelected);

                return (
                  <motion.button
                    key={segment.name}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{
                      duration: 0.2,
                      delay: index * 0.02,
                      layout: { duration: 0.3 },
                    }}
                    onClick={() => handleToggleSegment(segment.name)}
                    className={cn(
                      "compact inline-flex items-center gap-1.5 px-2.5 py-[2px] rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0 border",
                      colorClasses
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                    {segment.name}
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        isSelected
                          ? "opacity-90"
                          : "opacity-70"
                      )}
                    >
                      {segment.count}
                    </span>
                  </motion.button>
                );
              })}
            </div>
    </div>
  );
}
