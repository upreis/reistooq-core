"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
}

interface MagneticTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  items: Tab[]
  activeValue: string
  onValueChange?: (tabId: string) => void
}

export const MagneticTabs = React.forwardRef<HTMLDivElement, MagneticTabsProps>(
  ({ className, items, activeValue, onValueChange, ...props }, ref) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const [hoverStyle, setHoverStyle] = useState({})
    const [activeStyle, setActiveStyle] = useState({ left: "0px", width: "0px" })
    const tabRefs = useRef<(HTMLDivElement | null)[]>([])

    // Atualizar activeIndex quando activeValue mudar
    useEffect(() => {
      const newIndex = items.findIndex(item => item.id === activeValue)
      if (newIndex !== -1) {
        setActiveIndex(newIndex)
      }
    }, [activeValue, items])

    useEffect(() => {
      if (hoveredIndex !== null) {
        const hoveredElement = tabRefs.current[hoveredIndex]
        if (hoveredElement) {
          const { offsetLeft, offsetWidth } = hoveredElement
          setHoverStyle({
            left: `${offsetLeft}px`,
            width: `${offsetWidth}px`,
          })
        }
      }
    }, [hoveredIndex])

    useEffect(() => {
      const activeElement = tabRefs.current[activeIndex]
      if (activeElement) {
        const { offsetLeft, offsetWidth } = activeElement
        setActiveStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        })
      }
    }, [activeIndex])

    useEffect(() => {
      requestAnimationFrame(() => {
        const firstElement = tabRefs.current[activeIndex]
        if (firstElement) {
          const { offsetLeft, offsetWidth } = firstElement
          setActiveStyle({
            left: `${offsetLeft}px`,
            width: `${offsetWidth}px`,
          })
        }
      })
    }, [activeIndex])

    return (
      <div 
        ref={ref} 
        className={cn("relative", className)} 
        {...props}
      >
        <div className="relative">
          {/* Hover Highlight - Padrão Compacto */}
          <div
            className="absolute h-7 transition-all duration-300 ease-out bg-[#0e0f1114] dark:bg-[#ffffff1a] rounded-md flex items-center"
            style={{
              ...hoverStyle,
              opacity: hoveredIndex !== null ? 1 : 0,
            }}
          />

          {/* Active Indicator */}
          <div
            className="absolute bottom-[-4px] h-[2px] bg-primary transition-all duration-300 ease-out"
            style={activeStyle}
          />

          {/* Tabs - Padrão Compacto */}
          <div className="relative flex space-x-[4px] items-center">
            {items.map((tab, index) => (
              <div
                key={tab.id}
                ref={(el) => (tabRefs.current[index] = el)}
                className={cn(
                  "px-2.5 py-1 cursor-pointer transition-colors duration-300 h-7 flex items-center gap-1.5",
                  index === activeIndex 
                    ? "text-foreground" 
                    : "text-muted-foreground"
                )}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => {
                  setActiveIndex(index)
                  onValueChange?.(tab.id)
                }}
              >
                {tab.icon && <span className="text-xs">{tab.icon}</span>}
                <div className="text-xs font-semibold leading-4 whitespace-nowrap">
                  {tab.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
)
MagneticTabs.displayName = "MagneticTabs"
