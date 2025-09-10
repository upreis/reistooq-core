import * as React from "react"

// Safe no-op tooltip implementations to avoid Radix runtime issues
// These components preserve structure without relying on @radix-ui/react-tooltip

type ProviderProps = React.PropsWithChildren<{
  delayDuration?: number
  disableHoverableContent?: boolean
}>

export function TooltipProvider({ children }: React.PropsWithChildren<any>) {
  return <>{children}</>
}

export function Tooltip({ children, ..._rest }: React.PropsWithChildren<any>) {
  return <>{children}</>
}

export const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button"> & { asChild?: boolean }
>(({ asChild, className, children, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    // If used with `asChild`, just render the child directly
    return children as any
  }
  return (
    <button ref={ref} className={className} {...props}>
      {children}
    </button>
  )
})
TooltipTrigger.displayName = "TooltipTrigger"

export type TooltipContentProps = React.ComponentPropsWithoutRef<"div"> & {
  side?: "top" | "bottom" | "left" | "right"
  sideOffset?: number
  align?: "start" | "end" | "center"
}

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, children, ...props }, ref) => {
    // No-op content: render nothing to avoid popover logic
    return null
  }
)
TooltipContent.displayName = "TooltipContent"
