"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { cn } from "@/lib/utils"
import { Grid3X3, LayoutList, Package } from "lucide-react"
import { ProductWithStock } from "@/hooks/useEstoqueProducts"

export type LayoutMode = "grid" | "list"

const layoutIcons = {
  grid: Grid3X3,
  list: LayoutList,
}

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
  defaultLayout = "grid",
}: ProductStockMorphingCardProps) {
  const [layout, setLayout] = useState<LayoutMode>(defaultLayout)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  // Estados para imagem flutuante ampliada
  const [hoveredProductIndex, setHoveredProductIndex] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [smoothPosition, setSmoothPosition] = useState({ x: 0, y: 0 })
  const [isImageVisible, setIsImageVisible] = useState(false)
  const gridContainerRef = useRef<HTMLDivElement>(null)
  const listContainerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  // Animação suave para seguir o mouse
  useEffect(() => {
    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor
    }

    const animate = () => {
      setSmoothPosition((prev) => ({
        x: lerp(prev.x, mousePosition.x, 0.15),
        y: lerp(prev.y, mousePosition.y, 0.15),
      }))
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [mousePosition])

  const handleGridMouseMove = (e: React.MouseEvent) => {
    if (gridContainerRef.current) {
      const rect = gridContainerRef.current.getBoundingClientRect()
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleListMouseMove = (e: React.MouseEvent) => {
    if (listContainerRef.current) {
      const rect = listContainerRef.current.getBoundingClientRect()
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleMouseEnter = (index: number) => {
    setHoveredProductIndex(index)
    setIsImageVisible(true)
  }

  const handleMouseLeave = () => {
    setHoveredProductIndex(null)
    setIsImageVisible(false)
  }

  if (!products || products.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-4 text-muted-foreground", className)}>
        <Package className="h-8 w-8 mb-2" />
        <span className="text-sm">Sem produtos</span>
      </div>
    )
  }

  const displayCards = products.map((p, i) => ({ ...p, stackPosition: i }))
  const needsScroll = products.length > MAX_VISIBLE_ITEMS

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
        {layout === "grid" && (
          <div 
            ref={gridContainerRef}
            onMouseMove={handleGridMouseMove}
            className={cn(
              "relative grid grid-cols-4 gap-3 w-full",
              needsScroll && "max-h-[280px] overflow-y-auto pr-1"
            )}
          >
            <AnimatePresence mode="popLayout">
              {displayCards.map((product, index) => (
                <motion.div
                  key={product.id}
                  layoutId={product.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  onClick={() => setExpandedCard(expandedCard === product.id ? null : product.id)}
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
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

            {/* Floating Image - aparece ao hover */}
            {products.length > 0 && (
              <div
                className="pointer-events-none fixed z-50 overflow-hidden rounded-xl shadow-2xl"
                style={{
                  left: gridContainerRef.current?.getBoundingClientRect().left ?? 0,
                  top: gridContainerRef.current?.getBoundingClientRect().top ?? 0,
                  transform: `translate3d(${smoothPosition.x + 20}px, ${smoothPosition.y - 100}px, 0)`,
                  opacity: isImageVisible ? 1 : 0,
                  scale: isImageVisible ? 1 : 0.8,
                  transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), scale 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <div className="relative w-[200px] h-[200px] bg-white rounded-xl overflow-hidden shadow-xl">
                  {products.map((product, index) => (
                    <img
                      key={product.id}
                      src={product.url_imagem || "/placeholder.svg"}
                      alt={product.nome}
                      className="absolute inset-0 w-full h-full object-contain bg-white transition-all duration-500 ease-out"
                      style={{
                        opacity: hoveredProductIndex === index ? 1 : 0,
                        scale: hoveredProductIndex === index ? 1 : 1.1,
                        filter: hoveredProductIndex === index ? "none" : "blur(10px)",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {layout === "list" && (
          <div 
            ref={listContainerRef}
            onMouseMove={handleListMouseMove}
            className={cn(
              "relative flex flex-col gap-2 w-full",
              needsScroll && "max-h-[320px] overflow-y-auto pr-1"
            )}
          >
            <AnimatePresence mode="popLayout">
              {displayCards.map((product, index) => (
                <motion.div
                  key={product.id}
                  layoutId={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  onClick={() => setExpandedCard(expandedCard === product.id ? null : product.id)}
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                  className={cn(
                    "cursor-pointer rounded-lg border bg-card/50 overflow-hidden min-h-[80px]",
                    borderColor,
                    "hover:bg-card hover:border-primary/50 transition-all",
                    expandedCard === product.id && "ring-2 ring-primary",
                  )}
                >
                  <div className="flex items-center gap-4 p-4 h-full">
                    {/* Thumbnail */}
                    <div className="h-14 w-14 flex-shrink-0 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                      {product.url_imagem ? (
                        <img 
                          src={product.url_imagem} 
                          alt={product.nome}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate mb-0.5">{product.sku_interno}</p>
                      <h4 className="text-sm font-medium text-card-foreground line-clamp-2">{product.nome}</h4>
                    </div>
                    
                    {/* Quantidade */}
                    <div className="flex-shrink-0 text-right">
                      <p className={cn(
                        "text-lg font-bold",
                        type === 'high' ? 'text-green-500' : 'text-red-500'
                      )}>
                        {product.quantidade}
                      </p>
                      <p className="text-[10px] text-muted-foreground">unidades</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Floating Image - List Mode */}
            {isImageVisible && hoveredProductIndex !== null && (
              <div
                className="pointer-events-none absolute z-50 transition-opacity duration-300"
                style={{
                  left: `${smoothPosition.x + 20}px`,
                  top: `${smoothPosition.y - 100}px`,
                  opacity: isImageVisible ? 1 : 0,
                }}
              >
                <div className="relative w-[200px] h-[200px] bg-white rounded-xl overflow-hidden shadow-xl">
                  {products.map((product, index) => (
                    <img
                      key={product.id}
                      src={product.url_imagem || "/placeholder.svg"}
                      alt={product.nome}
                      className="absolute inset-0 w-full h-full object-contain bg-white transition-all duration-500 ease-out"
                      style={{
                        opacity: hoveredProductIndex === index ? 1 : 0,
                        scale: hoveredProductIndex === index ? 1 : 1.1,
                        filter: hoveredProductIndex === index ? "none" : "blur(10px)",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </LayoutGroup>
    </div>
  )
}
