import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ScannerErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Scanner Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Erro no Scanner</h3>
            <p className="text-sm text-muted-foreground mb-4">
              O scanner encontrou um erro. Por favor, tente atualizar a página.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar Página
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
