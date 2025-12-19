/**
 * 🏷️ FILTRO DE SEGMENTOS - Estoque Grid View
 * Chips animados para filtrar produtos por categoria/segmento
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, X, Filter } from "lucide-react";
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

  if (segments.length <= 1) {
    // Não mostrar se só tem um segmento
    return null;
  }

  return (
    <div className={cn("border-b bg-card/30 overflow-hidden", className)}>
      {/* Header com toggle */}
      <div className="flex items-center justify-between px-3 py-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span className="font-medium">Segmentos</span>
          {selectedSegments.length > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {selectedSegments.length}
            </Badge>
          )}
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-xs"
          >
            ▼
          </motion.span>
        </button>

        {selectedSegments.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-6 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Chips de segmentos */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 px-3 pb-3">
              {/* Botão "Todos" */}
              <motion.button
                layout
                onClick={handleSelectAll}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                  "border hover:shadow-sm",
                  isAllSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Tag className="w-3.5 h-3.5" />
                Todos
                <span className="text-xs opacity-70">({products.length})</span>
              </motion.button>

              {/* Chips dos segmentos */}
              {segments.map((segment, index) => {
                const isSelected = selectedSegments.includes(segment.name);

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
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                      "border hover:shadow-sm",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {segment.name}
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full",
                        isSelected
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {segment.count}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
