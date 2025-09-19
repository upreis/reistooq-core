import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🔥 REISTOOQ - Erro crítico:', error, errorInfo)
    
    // Detectar múltiplas instâncias React
    if (error.message.includes('dispatcher') || error.message.includes('Invalid hook call')) {
      console.error('🚨 MÚLTIPLAS INSTÂNCIAS REACT DETECTADAS - Verificar vite.config.ts')
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen p-4 bg-background">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Sistema Temporariamente Indisponível</h2>
            <p className="text-muted-foreground mb-4">
              Detectamos um problema técnico no Reistooq.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Recarregar Sistema
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}