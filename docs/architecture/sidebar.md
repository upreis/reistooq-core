# Sidebar Architecture

## Overview

The REISTOQ application uses a single, enhanced sidebar implementation (`EnhancedSidebar`) that provides a rich user experience with flyouts, tooltips, and keyboard navigation.

## Source of Truth

- **State Management**: `SidebarUIProvider` (src/context/SidebarUIContext.tsx)
- **Component**: `EnhancedSidebar` (src/components/sidebar/enhanced/components/EnhancedSidebar.tsx)
- **Layout Integration**: `FullLayout` (src/layouts/full/FullLayout.tsx)
- **Configuration**: `enhanced-nav.ts` (src/config/enhanced-nav.ts)
- **Behavior Config**: `sidebar-behavior.ts` (src/config/sidebar-behavior.ts)

## Portal Integration

The sidebar flyouts are rendered using React Portals to ensure proper z-index layering:

- **Portal Root**: `<div id="portal-root"></div>` in `index.html`
- **Z-Index**: Flyouts use `z-index: 80` (defined in config)
- **Overflow**: Parent sidebar uses `overflow-visible` to prevent clipping

## Behavior Matrix

### Expanded State (w-[264px])

| Element | Action | Result |
|---------|--------|--------|
| Parent with children | Click | Toggle group expand/collapse (NO navigation) |
| Parent with children | Hover | No special behavior |
| Child item | Click | Navigate to route |
| Any item | Keyboard → | Open/expand group |
| Any item | Keyboard ← | Close/collapse group |
| Any item | Enter/Space | Toggle group state |

### Collapsed State (w-[72px])

| Element | Action | Result |
|---------|--------|--------|
| Parent with children | Hover | Open flyout after 120ms delay |
| Parent with children | Click | Pin flyout for 1500ms (NO navigation) |
| Child item (in flyout) | Click | Navigate to route |
| Any item | Hover | Show tooltip after 200ms delay |
| Flyout | Mouse leave | Close after 200ms delay |
| Flyout | Escape key | Close immediately |

## Auto-Expansion Rules

- When navigating to a child route (e.g., `/configuracoes/integracoes`), the parent group ("Configurações") automatically expands
- Active child routes highlight both the child item and mark the parent as having an active child
- This behavior is handled by `useActiveRoute` hook

## Keyboard Navigation

- **Arrow Right (→)**: Open/expand group
- **Arrow Left (←)**: Close/collapse group  
- **Enter/Space**: Toggle group state
- **Escape**: Close flyout (when collapsed)
- **Tab**: Standard focus navigation through items

## State Persistence

- Sidebar collapsed/expanded state persists in localStorage (`ui.sidebar.collapsed`)
- Group expanded states persist in localStorage (`sidebar.expandedGroups`)
- Mobile sidebar state is session-only (resets on route change)

## Mobile Behavior

- Mobile sidebar renders as full-screen overlay (`fixed inset-0 z-50`)
- Automatically closes on route navigation
- No flyouts or tooltips on mobile
- Uses gesture-friendly touch targets

## Configuration Constants

```typescript
export const SIDEBAR_BEHAVIOR = {
  groupClick: 'toggle', // Parent click behavior
  hoverOpenDelayMs: 120,
  hoverCloseDelayMs: 200,
  pinOnClickMs: 1500,
  tooltipDelayMs: 200,
  flyoutZIndex: 80,
} as const;
```

## Architecture Rules

### ✅ ALLOWED

- One `<EnhancedSidebar>` render in `FullLayout.tsx`
- Using `SidebarUIProvider` for state management
- Importing EnhancedSidebar components and hooks
- Customizing nav items via `enhanced-nav.ts`
- Modifying behavior constants (with PR review)

### ❌ FORBIDDEN

- Multiple sidebar instances
- Legacy sidebar imports from `src/layouts/full/vertical/sidebar/*`
- Direct manipulation of sidebar DOM
- Hardcoded z-index values (use config constants)
- Custom sidebar implementations outside the enhanced system

## Testing Strategy

- **E2E Tests**: Cover all interaction scenarios in `tests/e2e/sidebar.spec.ts`
- **Unit Tests**: Component behavior in `src/components/sidebar/enhanced/__tests__/`
- **Guard Scripts**: Prevent architectural violations via `scripts/guard-select.sh`
- **ESLint Rules**: Enforce usage patterns via custom rules

## Debugging

When debugging sidebar issues:

1. Check React DevTools for duplicate providers
2. Verify `#portal-root` exists in DOM
3. Inspect z-index layering for flyouts
4. Check localStorage for persisted state
5. Validate nav item configuration structure
6. Test with different screen sizes and input methods

## Performance Considerations

- Components are memoized to prevent unnecessary re-renders
- Event listeners are properly cleaned up
- Portal rendering is optimized for flyout interactions
- Local storage operations are debounced
- Hover delays prevent accidental activations

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- Touch devices for mobile interactions  
- Keyboard navigation compliance (WCAG)
- Screen reader compatibility
- High contrast mode support