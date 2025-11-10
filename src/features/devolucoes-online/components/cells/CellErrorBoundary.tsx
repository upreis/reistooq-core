/**
 * 🛡️ ERROR BOUNDARY PARA CÉLULAS
 * Componente para capturar erros em células individuais
 * ⚡ OTIMIZADO: Previne que um erro em uma célula quebre a tabela inteira
 */

import { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CellErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  cellName?: string;
}

interface CellErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class CellErrorBoundary extends Component<CellErrorBoundaryProps, CellErrorBoundaryState> {
  constructor(props: CellErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): CellErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`❌ Erro na célula ${this.props.cellName || 'desconhecida'}:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center gap-2 text-xs text-destructive p-2">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          <span>Erro ao carregar</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 px-2 text-xs"
            onClick={this.handleReset}
          >
            Tentar novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
