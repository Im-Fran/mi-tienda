import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/errors"

interface ErrorStateProps {
  message: string
  error?: unknown
  retry?: () => void
}

export function ErrorState({ message, error, retry }: ErrorStateProps) {
  const detail = error !== undefined ? getErrorMessage(error, "") : ""

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="flex flex-col gap-1">
        <p className="font-medium">{message}</p>
        {detail && <p className="text-muted-foreground max-w-sm text-sm">{detail}</p>}
      </div>
      {retry && (
        <Button variant="outline" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  )
}
