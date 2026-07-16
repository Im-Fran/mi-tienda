import { useNavigate } from "react-router-dom"
import { FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
      <FileQuestion className="h-12 w-12 text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <p className="text-lg font-medium">Página no encontrada</p>
        <p className="text-muted-foreground max-w-sm text-sm">
          La página que buscas no existe o fue movida.
        </p>
      </div>
      <Button onClick={() => navigate("/")}>Volver al inicio</Button>
    </div>
  )
}
