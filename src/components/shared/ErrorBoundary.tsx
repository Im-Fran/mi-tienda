import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/** Boundary global: captura errores de render no manejados y evita una pantalla en blanco. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled error caught by ErrorBoundary:", error, info)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <div className="flex flex-col gap-1">
            <p className="text-lg font-medium">Algo salió mal</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              Ocurrió un error inesperado. Intenta recargar la página.
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>Recargar</Button>
        </div>
      )
    }
    return this.props.children
  }
}
