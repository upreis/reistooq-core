# Enhanced Sidebar Documentation

## Overview

The Enhanced Sidebar is a modern, accessible sidebar component with flyout support, tooltips, and touch-friendly interactions. It fixes the common issue where submenus are inaccessible when the sidebar is collapsed.

## Features

- ✅ **Flyout Submenus**: Portal-rendered flyouts that work when sidebar is collapsed
- ✅ **Accessible Tooltips**: Show item names on hover with 200ms delay
- ✅ **Touch Support**: Tap-to-expand behavior on touch devices
- ✅ **Keyboard Navigation**: Full keyboard support with shortcuts
- ✅ **Active Route Detection**: Hierarchical active state for parent/child routes
- ✅ **State Persistence**: Remembers expanded/collapsed state in localStorage
- ✅ **Performance Optimized**: Memoized components and debounced events

## Components

### Core Components

- `EnhancedSidebar`: Main sidebar shell with toggle and context
- `SidebarItemWithChildren`: Items with submenu flyouts
- `SidebarFlyout`: Portal-rendered submenu overlay
- `SidebarTooltip`: Accessible tooltip component

### Hooks

- `useSidebarState`: Manages expanded/collapsed state with persistence
- `useActiveRoute`: Resolves active routes including child routes

## Usage

```tsx
import { EnhancedSidebar, SidebarProvider } from '@/components/sidebar/enhanced';
import { ENHANCED_NAV_ITEMS } from '@/config/enhanced-nav';

// In your layout
<SidebarProvider>
  <EnhancedSidebar 
    navItems={ENHANCED_NAV_ITEMS}
    isMobile={false}
    onMobileClose={() => {}}
  />
</SidebarProvider>
```

## Configuration

### Navigation Items

Configure your navigation in `/config/enhanced-nav.ts`:

```tsx
export const ENHANCED_NAV_ITEMS: NavSection[] = [
  {
    id: 'dashboards',
    group: 'Dashboards',
    items: [
      { 
        id: 'dashboard', 
        label: 'Dashboard', 
        path: '/', 
        icon: 'LayoutDashboard' 
      }
    ]
  },
  {
    id: 'applications',
    group: 'Aplicações',
    items: [
      {
        id: 'ecommerce-app',
        label: 'eCommerce',
        icon: 'ShoppingCart',
        children: [
          { 
            id: 'shop', 
            label: 'Loja', 
            path: '/apps/ecommerce/shop', 
            icon: 'ShoppingCart' 
          }
        ]
      }
    ]
  }
];
```

### Sidebar Configuration

Adjust behavior in the config:

```tsx
export const SIDEBAR_CONFIG = {
  expandedWidth: 264,      // Width when expanded (px)
  collapsedWidth: 72,      // Width when collapsed (px)
  hoverOpenDelay: 120,     // Delay before opening flyout (ms)
  hoverCloseDelay: 200,    // Delay before closing flyout (ms)
  zIndexFlyout: 70,        // Z-index for flyout portals
  persistKey: 'ui.sidebar.expanded',
  animationDuration: 200   // Transition duration (ms)
};
```

## Props

### EnhancedSidebar Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `navItems` | `NavSection[]` | ✅ | Navigation structure |
| `isMobile` | `boolean` | ❌ | Mobile mode flag |
| `onMobileClose` | `() => void` | ❌ | Mobile close handler |

### NavItem Structure

```tsx
interface NavItem {
  id: string;
  label: string;
  path?: string;           // Route path
  icon: string;            // Lucide icon name
  children?: NavItem[];    // Submenu items
  roles?: string[];        // RBAC roles
  feature?: string;        // Feature flag
  badge?: {                // Badge configuration
    content: string | number;
    variant: 'default' | 'destructive' | 'warning' | 'success';
  };
}
```

## Keyboard Shortcuts

- `Ctrl/Cmd + B`: Toggle sidebar expand/collapse
- `Tab`: Navigate through items
- `Enter/Space`: Activate item or toggle submenu
- `Arrow Up/Down`: Navigate within flyouts
- `Escape`: Close open flyouts

## Touch Behavior

- **First tap** on item with children: Opens flyout
- **Second tap** on same item: Navigates to item (if has path)
- **Tap outside**: Closes flyout

## Accessibility Features

- Full ARIA support with proper roles and states
- Keyboard navigation with focus management
- Screen reader announcements
- High contrast support
- Focus visible indicators

## Troubleshooting

### Flyout Not Appearing

1. Check that Portal root exists: `<div id="portal-root"></div>` in index.html
2. Verify z-index configuration in SIDEBAR_CONFIG
3. Ensure parent containers don't have `overflow: hidden` cutting the flyout

### Tooltips Not Working

1. Check hover delay configuration (hoverOpenDelay)
2. Verify item has `label` property
3. Test keyboard focus - tooltips should appear on focus too

### Performance Issues

1. Large navigation (>100 items): Consider implementing virtualization
2. Excessive re-renders: Check if nav items are memoized
3. Slow hover response: Adjust debounce delays in config

## Testing

### Manual Tests

1. **Collapsed State**: Hover over items with children - flyout should appear
2. **Tooltips**: Hover over collapsed items - name should appear after 200ms
3. **Keyboard**: Tab through items, use arrows in flyouts, Escape closes
4. **Touch**: Tap to expand, tap again to navigate
5. **Active Routes**: Navigate to child route - parent should be highlighted

### Automated Tests

```bash
# Add to your test suite
describe('Enhanced Sidebar', () => {
  it('shows flyout on hover when collapsed', () => {
    // Test implementation
  });
  
  it('shows tooltip on hover', () => {
    // Test implementation
  });
  
  it('supports keyboard navigation', () => {
    // Test implementation
  });
});
```

## Migration from Old Sidebar

1. **Install**: Components are already created in `/components/sidebar/enhanced/`
2. **Configure**: Update navigation in `/config/enhanced-nav.ts`
3. **Integrate**: Replace old sidebar in layout with EnhancedSidebar
4. **Test**: Verify all functionality works as expected
5. **Clean up**: Remove old sidebar components when confident

## Performance Considerations

- Components are memoized to prevent unnecessary re-renders
- Event handlers use `useCallback` for stable references
- Navigation items should be defined outside component (constant)
- Portal rendering avoids layout thrashing

## Browser Support

- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- Mobile browsers with pointer event support
- Graceful degradation for older browsers (no flyouts, basic tooltips)

## Future Enhancements

- [ ] Global search (Cmd/Ctrl+K)
- [ ] Navigation analytics
- [ ] Favorites/Recent items
- [ ] Virtualization for large lists
- [ ] Drag & drop reordering