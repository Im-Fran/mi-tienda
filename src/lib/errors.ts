import { ApiError } from "@/api/client"

/**
 * Deriva un mensaje de error legible a partir de un error desconocido.
 * - ApiError: usa el mensaje real devuelto por el backend.
 * - Error de red (fetch falló, sin conexión): mensaje de "sin conexión".
 * - Cualquier otro caso: usa el fallback provisto por el caller.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message

  const isNetworkError =
    err instanceof TypeError ||
    (err instanceof Error && /failed to fetch|networkerror/i.test(err.message))
  if (isNetworkError) return "Sin conexión a internet"

  return fallback
}
