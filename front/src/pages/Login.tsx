import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import logoObras from "@/assets/logo-obras.png"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      await login(email, password)
      toast.success("Sesión iniciada correctamente")
      navigate("/")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar sesión")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />

      <Card className="w-full max-w-md mx-4 border-none shadow-xl relative z-10">
        <CardContent className="pt-10 pb-8 px-8">
          {/* Logo & branding */}
          <div className="flex flex-col items-center mb-8">
            <img src={logoObras} alt="Obras y Armados Estructurales" className="w-20 h-20 object-contain mb-4" />
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              OBRAS
            </h1>
            <p className="text-xs text-muted-foreground tracking-widest">Y ARMADOS ESTRUCTURALES</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all text-base font-semibold"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {isSubmitting ? "Ingresando..." : "Iniciar Sesión"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()} Obras y Armados Estructurales
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
