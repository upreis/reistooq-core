"use client"

import { useState } from "react"
import { motion, AnimatePresence, LayoutGroup, type PanInfo } from "framer-motion"
import { cn } from "@/lib/utils"
import { Grid3X3, Layers, LayoutList, Package } from "lucide-react"
import { ProductWithStock } from "@/hooks/useEstoqueProducts"

export type LayoutMode = "stack" | "grid" | "list"

const layoutIcons = {
  stack: Layers,
  grid: Grid3X3,
  list: LayoutList,
}

const SWIPE_THRESHOLD = 50
const MAX_VISIBLE_ITEMS = 4

interface ProductStockMorphingCardProps {
  products: ProductWithStock[]
  title: string
  type: 'high' | 'low'
  className?: string
  defaultLayout?: LayoutMode
}

export function ProductStockMorphingCard({
  products,
  title,
  type,
  className,
  defaultLayout = "stack",
}: ProductStockMorphingCardProps) {
  const [layout, setLayout] = useState<LayoutMode>(defaultLayout)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  if (!products || products.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-4 text-muted-foreground", className)}>
        <Package className="h-8 w-8 mb-2" />
        <span className="text-sm">Sem produtos</span>
      </div>
    )
  }

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info
    const swipe = Math.abs(offset.x) * velocity.x

    if (offset.x < -SWIPE_THRESHOLD || swipe < -1000) {
      setActiveIndex((prev) => (prev + 1) % products.length)
    } else if (offset.x > SWIPE_THRESHOLD || swipe > 1000) {
      setActiveIndex((prev) => (prev - 1 + products.length) % products.length)
    }
    setIsDragging(false)
  }

  const getStackOrder = () => {
    const reordered = []
    for (let i = 0; i < products.length; i++) {
      const index = (activeIndex + i) % products.length
      reordered.push({ ...products[index], stackPosition: i })
    }
    return reordered.reverse()
  }

  const getLayoutStyles = (stackPosition: number) => {
    switch (layout) {
      case "stack":
        return {
          top: stackPosition * 6,
          left: stackPosition * 6,
          zIndex: products.length - stackPosition,
          rotate: (stackPosition - 1) * 1.5,
        }
      case "grid":
      case "list":
        return {
          top: 0,
          left: 0,
          zIndex: 1,
          rotate: 0,
        }
    }
  }

  const displayCards = layout === "stack" 
    ? getStackOrder() 
    : products.map((p, i) => ({ ...p, stackPosition: i }))

  const needsScroll = (layout === "grid" || layout === "list") && products.length > MAX_VISIBLE_ITEMS

  const borderColor = type === 'high' ? 'border-green-500/30' : 'border-red-500/30'
  const titleColor = type === 'high' ? 'text-green-500' : 'text-red-500'

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header com título e toggle */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className={cn("text-sm font-semibold", titleColor)}>{title}</h3>
        
        {/* Layout Toggle */}
        <div className="flex items-center gap-0.5 rounded-md bg-secondary/50 p-0.5">
          {(Object.keys(layoutIcons) as LayoutMode[]).map((mode) => {
            const Icon = layoutIcons[mode]
            return (
              <button
                key={mode}
                onClick={() => setLayout(mode)}
                className={cn(
                  "rounded p-1.5 transition-all",
                  layout === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
                aria-label={`Switch to ${mode} layout`}
              >
                <Icon className="h-3 w-3" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Cards Container */}
      <LayoutGroup>
      {layout === "stack" && (
          <div className="relative h-[280px] w-[240px] mx-auto">
            <AnimatePresence mode="popLayout">
              {displayCards.map((product) => {
                const styles = getLayoutStyles(product.stackPosition)
                const isTopCard = product.stackPosition === 0

                return (
                  <motion.div
                    key={product.id}
                    layoutId={product.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      x: 0,
                      ...styles,
                    }}
                    exit={{ opacity: 0, scale: 0.8, x: -200 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                    }}
                    drag={isTopCard ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.7}
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={handleDragEnd}
                    whileDrag={{ scale: 1.02, cursor: "grabbing" }}
                    className={cn(
                      "absolute w-[200px] h-[240px] rounded-2xl border-2 bg-card overflow-hidden shadow-lg",
                      borderColor,
                      isTopCard && "cursor-grab active:cursor-grabbing",
                    )}
                  >
                    {/* Imagem do produto - quadrada */}
                    <div className="h-[140px] w-full bg-muted flex items-center justify-center overflow-hidden">
                      {product.url_imagem ? (
                        <img 
                          src={product.url_imagem} 
                          alt={product.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Info do produto */}
                    <div className="p-3">
                      <p className="text-[10px] text-muted-foreground truncate">{product.sku_interno}</p>
                      <h4 className="text-xs font-medium text-card-foreground line-clamp-2 mt-1">{product.nome}</h4>
                      <p className={cn(
                        "text-base font-bold mt-1",
                        type === 'high' ? 'text-green-500' : 'text-red-500'
                      )}>
                        {product.quantidade} un
                      </p>
                    </div>

                    {isTopCard && (
                      <div className="absolute bottom-1 left-0 right-0 text-center">
                        <span className="text-[10px] text-muted-foreground/50">Arraste para navegar</span>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {layout === "grid" && (
          <div className={cn(
            "grid grid-cols-2 gap-4 w-full",
            needsScroll && "max-h-[320px] overflow-y-auto pr-1"
          )}>
            <AnimatePresence mode="popLayout">
              {displayCards.map((product) => (
                <motion.div
                  key={product.id}
                  layoutId={product.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  onClick={() => setExpandedCard(expandedCard === product.id ? null : product.id)}
                  className={cn(
                    "cursor-pointer rounded-xl border-2 bg-card overflow-hidden shadow-md",
                    borderColor,
                    "hover:border-primary/50 transition-colors",
                    expandedCard === product.id && "ring-2 ring-primary",
                  )}
                >
                  {/* Imagem */}
                  <div className="h-24 w-full bg-muted flex items-center justify-center overflow-hidden">
                    {product.url_imagem ? (
                      <img 
                        src={product.url_imagem} 
                        alt={product.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="p-2">
                    <p className="text-[9px] text-muted-foreground truncate">{product.sku_interno}</p>
                    <p className={cn(
                      "text-sm font-bold",
                      type === 'high' ? 'text-green-500' : 'text-red-500'
                    )}>
                      {product.quantidade} un
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {layout === "list" && (
          <div className={cn(
            "flex flex-col gap-3 w-full",
            needsScroll && "max-h-[320px] overflow-y-auto pr-1"
          )}>
            <AnimatePresence mode="popLayout">
              {displayCards.map((product) => (
                <motion.div
                  key={product.id}
                  layoutId={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  onClick={() => setExpandedCard(expandedCard === product.id ? null : product.id)}
                  className={cn(
                    "cursor-pointer rounded-xl border-2 bg-card overflow-hidden shadow-md",
                    borderColor,
                    "hover:border-primary/50 transition-colors",
                    expandedCard === product.id && "ring-2 ring-primary",
                  )}
                >
                  <div className="flex items-center gap-2 p-2">
                    {/* Thumbnail */}
                    <div className="h-12 w-12 flex-shrink-0 rounded bg-muted flex items-center justify-center overflow-hidden">
                      {product.url_imagem ? (
                        <img 
                          src={product.url_imagem} 
                          alt={product.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground truncate">{product.sku_interno}</p>
                      <h4 className="text-xs font-medium text-card-foreground truncate">{product.nome}</h4>
                    </div>
                    
                    {/* Quantidade */}
                    <p className={cn(
                      "text-sm font-bold flex-shrink-0",
                      type === 'high' ? 'text-green-500' : 'text-red-500'
                    )}>
                      {product.quantidade}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </LayoutGroup>

      {/* Indicadores de posição (apenas para stack) */}
      {layout === "stack" && products.length > 1 && (
        <div className="flex justify-center gap-1 mt-3">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === activeIndex 
                  ? "w-4 bg-primary" 
                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50",
              )}
              aria-label={`Ir para card ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
