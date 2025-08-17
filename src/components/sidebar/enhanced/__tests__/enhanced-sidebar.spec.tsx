import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { expect, describe, test, beforeEach, vi } from 'vitest';

// Mock screen from testing library
const screen = {
  getByText: (text: string) => document.querySelector(`*:contains("${text}")`) as HTMLElement,
  getByRole: (role: string) => document.querySelector(`[role="${role}"]`) as HTMLElement,
  getByLabelText: (label: string) => document.querySelector(`[aria-label="${label}"]`) as HTMLElement,
};
import { EnhancedSidebar } from '../components/EnhancedSidebar';
import { SidebarProvider } from '../SidebarContext';
import { SidebarUIProvider } from '@/context/SidebarUIContext';
import { NavSection } from '../types/sidebar.types';

const mockNavItems: NavSection[] = [
  {
    id: 'main',
    group: 'Principal',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/',
        icon: 'LayoutDashboard'
      },
      {
        id: 'configuracoes',
        label: 'Configurações',
        icon: 'Settings',
        children: [
          {
            id: 'integracoes',
            label: 'Integrações',
            path: '/configuracoes/integracoes',
            icon: 'Plug'
          }
        ]
      }
    ]
  }
];

const TestWrapper = ({ children, initialRoute = '/' }: { children: React.ReactNode; initialRoute?: string }) => (
  <MemoryRouter initialEntries={[initialRoute]}>
    <SidebarUIProvider>
      <SidebarProvider>
        <div id="portal-root"></div>
        {children}
      </SidebarProvider>
    </SidebarUIProvider>
  </MemoryRouter>
);

describe('EnhancedSidebar', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('renders sidebar with basic structure', () => {
    render(
      <TestWrapper>
        <EnhancedSidebar navItems={mockNavItems} />
      </TestWrapper>
    );

    expect(screen.getByText('REISTOQ')).toBeInTheDocument();
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Principal')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  test('marks active route hierarchically', () => {
    render(
      <TestWrapper initialRoute="/configuracoes/integracoes">
        <EnhancedSidebar navItems={mockNavItems} />
      </TestWrapper>
    );

    // Parent item should be marked as having active child
    const configItem = screen.getByText('Configurações').closest('a');
    expect(configItem).toHaveClass('bg-[hsl(var(--accent))]');
  });

  test('toggles collapse state and persists to localStorage', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <EnhancedSidebar navItems={mockNavItems} />
      </TestWrapper>
    );

    // Initial state should be expanded
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('w-[264px]');

    // Mock the toggle button behavior (would be in Header component)
    const mockToggle = () => {
      const event = new CustomEvent('sidebarToggle');
      window.dispatchEvent(event);
    };

    // Simulate toggle
    mockToggle();

    // Check localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('ui.sidebar.collapsed', 'true');
  });

  test('shows tooltips only when collapsed', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <EnhancedSidebar navItems={mockNavItems} isCollapsed={true} />
      </TestWrapper>
    );

    // Sidebar should be collapsed
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('w-[72px]');

    // Hover over item should show tooltip
    const configItem = screen.getByText('Configurações');
    await user.hover(configItem);

    // Tooltip should appear (simplified test)
    expect(document.querySelector('[role="tooltip"]')).toBeTruthy();
  });

  test('handles mobile sidebar correctly', () => {
    const mockOnMobileClose = vi.fn();
    
    render(
      <TestWrapper>
        <EnhancedSidebar 
          navItems={mockNavItems} 
          isMobile={true}
          onMobileClose={mockOnMobileClose}
        />
      </TestWrapper>
    );

    // Should render mobile sidebar
    expect(screen.getByLabelText('Fechar menu')).toBeInTheDocument();
  });

  test('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <EnhancedSidebar navItems={mockNavItems} />
      </TestWrapper>
    );

    const configItem = screen.getByText('Configurações');
    configItem.focus();

    // Test keyboard navigation
    await user.keyboard('{ArrowRight}');
    // Group should expand (implementation detail depends on SidebarItemWithChildren)

    await user.keyboard('{Enter}');
    // Should toggle group state
  });

  test('renders unique sidebar instance', () => {
    const { container } = render(
      <TestWrapper>
        <EnhancedSidebar navItems={mockNavItems} />
      </TestWrapper>
    );

    // Should find exactly one sidebar
    const sidebars = container.querySelectorAll('[role="complementary"]');
    expect(sidebars).toHaveLength(1);
  });

  test('handles badge display correctly', () => {
    const navItemsWithBadge: NavSection[] = [
      {
        id: 'main',
        group: 'Principal',
        items: [
          {
            id: 'notifications',
            label: 'Notificações',
            path: '/notifications',
            icon: 'Bell',
            badge: {
              content: '5',
              variant: 'destructive'
            }
          }
        ]
      }
    ];

    render(
      <TestWrapper>
        <EnhancedSidebar navItems={navItemsWithBadge} />
      </TestWrapper>
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });
});