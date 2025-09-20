// F5.1: Layout mobile responsivo com menu hambúrguer
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileLayoutProps {
  children: React.ReactNode;
  title: string;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  className?: string;
}

export function MobileLayout({
  children,
  title,
  searchable = false,
  searchValue = '',
  onSearchChange,
  actions,
  filters,
  className
}: MobileLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex h-14 items-center gap-4 px-4">
          {/* Menu Button */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <div className="py-4">
                <h2 className="text-lg font-semibold mb-4">Menu</h2>
                {/* Aqui seria o conteúdo do menu de navegação */}
                <nav className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start">
                    Pedidos
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    Estoque
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    Relatórios
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    Configurações
                  </Button>
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          {/* Title / Search */}
          <div className="flex-1">
            {isSearchOpen && searchable ? (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar..."
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="h-9"
                  autoFocus
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 w-9 p-0"
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <h1 className="font-semibold text-foreground truncate">
                {title}
              </h1>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {searchable && !isSearchOpen && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 w-9 p-0"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
            {actions}
          </div>
        </div>

        {/* Filters Row (if provided) */}
        {filters && (
          <div className="px-4 pb-3 border-t">
            {filters}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 pb-20">
        {children}
      </main>
    </div>
  );
}

// Hook para simplificar o uso do layout mobile
export function useMobileLayout() {
  const isMobile = useIsMobile();
  
  return {
    isMobile,
    Layout: MobileLayout,
  };
}