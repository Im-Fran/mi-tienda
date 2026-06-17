import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useSendMagicLink, useVerifyMagicLink } from "@/hooks/useAuth"
import { useAuthStore } from "@/stores/auth.store"
import { getOAuthUrl } from "@/api/endpoints/auth"
import { loginSchema } from "@/lib/validators"
import type { z } from "zod"
import { ApiError } from "@/api/client"

type LoginForm = z.infer<typeof loginSchema>

export function AdminLoginPage() {
  const [sent, setSent] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const session = useAuthStore((s) => s.session)
  const { mutate: sendLink, isPending: sending } = useSendMagicLink()
  const { mutate: verifyLink } = useVerifyMagicLink()
  const setSession = useAuthStore((s) => s.setSession)

  useEffect(() => {
    if (session) navigate("/admin/dashboard", { replace: true })
  }, [session, navigate])

  useEffect(() => {
    const token = searchParams.get("token")
    const email = searchParams.get("email")
    if (token && email) {
      verifyLink(
        { token, email },
        {
          onSuccess: (data) => {
            setSession({ token: data.token, user: data.user })
            navigate("/admin/dashboard", { replace: true })
          },
          onError: (err) => {
            const msg = err instanceof ApiError ? err.message : "Invalid or expired link"
            toast.error(msg)
          },
        }
      )
    }
  }, [searchParams, verifyLink, setSession, navigate])

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  function onSubmit(data: LoginForm) {
    sendLink(data.email, {
      onSuccess: () => setSent(true),
      onError: (err) => {
        const msg = err instanceof ApiError ? err.message : "Failed to send link"
        toast.error(msg)
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">miTienda Admin</CardTitle>
          <CardDescription>Sign in to manage your stores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => { window.location.href = getOAuthUrl("google") }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => { window.location.href = getOAuthUrl("github") }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.28-.01-1.03-.01-2.02-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.22.69.82.57C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Continue with GitHub
            </Button>
          </div>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              OR
            </span>
          </div>

          {sent ? (
            <div className="text-center py-4">
              <p className="font-medium">Check your email</p>
              <p className="text-sm text-muted-foreground mt-1">
                We sent you a magic link. Click it to sign in.
              </p>
              <Button variant="link" className="mt-2" onClick={() => setSent(false)}>
                Use a different email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? "Sending..." : "Send magic link"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
