"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

export interface MagneticTabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  content?: React.ReactNode;
}

interface MagneticTabsProps {
  items: MagneticTabItem[];
  activeValue: string;
  onValueChange: (value: string) => void;
  className?: string;
  indicatorPadding?: number;
  children?: React.ReactNode;
}

export function MagneticTabs({
  items,
  activeValue,
  onValueChange,
  className,
  indicatorPadding = 6,
  children,
}: MagneticTabsProps) {
  const [hovered, setHovered] = React.useState<string | null>(null);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const indicatorX = useMotionValue(0);
  const indicatorWidth = useMotionValue(0);
  const indicatorTop = useMotionValue(0);
  const indicatorHeight = useMotionValue(0);

  const springConfig = { stiffness: 300, damping: 25 };
  const springX = useSpring(indicatorX, springConfig);
  const springW = useSpring(indicatorWidth, springConfig);
  const springTop = useSpring(indicatorTop, springConfig);
  const springH = useSpring(indicatorHeight, springConfig);

  const updateIndicator = (value: string) => {
    const idx = items.findIndex((item) => item.value === value);
    const btn = tabRefs.current[idx];
    const container = containerRef.current;
    if (btn && container) {
      const cRect = container.getBoundingClientRect();
      const tRect = btn.getBoundingClientRect();
      indicatorX.set(tRect.left - cRect.left - indicatorPadding);
      indicatorWidth.set(tRect.width + indicatorPadding * 2);
      indicatorTop.set(tRect.top - cRect.top - indicatorPadding);
      indicatorHeight.set(tRect.height + indicatorPadding * 2);
    }
  };

  React.useEffect(() => {
    updateIndicator(activeValue);
    const ro = new ResizeObserver(() => updateIndicator(activeValue));
    if (containerRef.current) ro.observe(containerRef.current);
    tabRefs.current.forEach((el) => el && ro.observe(el));
    window.addEventListener("resize", () => updateIndicator(activeValue));
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", () => updateIndicator(activeValue));
    };
  }, [activeValue, indicatorPadding]);

  React.useEffect(() => {
    if (hovered) updateIndicator(hovered);
    else updateIndicator(activeValue);
  }, [hovered, activeValue, indicatorPadding]);

  return (
    <div className={cn("w-full", className)}>
      <Tabs value={activeValue} onValueChange={onValueChange} className="w-full">
        <TabsList
          ref={containerRef}
          className="relative flex justify-start gap-2 p-2 bg-background/60 w-full"
        >
          {/* Magnetic Indicator */}
          <motion.div
            style={{
              left: springX,
              width: springW,
              top: springTop,
              height: springH,
            }}
            className="absolute rounded-lg bg-primary/30 pointer-events-none"
          >
            <motion.div
              className={cn("absolute inset-0 rounded-lg filter blur-md opacity-40")}
              initial={false}
              animate={{ opacity: 0.4 }}
            />
          </motion.div>

          {items.map((item, i) => (
            <TabsTrigger
              key={item.value}
              ref={(el) => (tabRefs.current[i] = el)}
              value={item.value}
              asChild
              onMouseEnter={() => setHovered(item.value)}
              onMouseLeave={() => setHovered(null)}
            >
              <motion.button
                className={cn(
                  "relative z-10 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                  activeValue === item.value ? "text-primary-foreground" : "text-muted-foreground"
                )}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                {item.icon && <span className="text-lg">{item.icon}</span>}
                {item.label}
              </motion.button>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Content */}
        {children && (
          <div className="mt-6 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeValue}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 250, damping: 25 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </Tabs>
    </div>
  );
}
