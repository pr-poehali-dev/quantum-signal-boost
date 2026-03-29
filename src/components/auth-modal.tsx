import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"

const AUTH_URL = "https://functions.poehali.dev/09bb8cdd-7dcc-470d-a8a0-a2383d82ad84"

interface AuthModalProps {
  onSuccess: (token: string, user: { id: number; name: string; email: string; balance: number }) => void
  onClose: () => void
}

export function AuthModal({ onSuccess, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"register" | "login">("register")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const body = mode === "register" ? { name, email, password } : { email, password }
      const res = await fetch(`${AUTH_URL}/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Ошибка")
      localStorage.setItem("token", data.token)
      onSuccess(data.token, data.user)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-8 w-full max-w-md mx-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <Icon name="X" size={20} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white font-orbitron">
            {mode === "register" ? "Регистрация" : "Вход"}
          </h2>
          <p className="text-gray-400 mt-1 text-sm">
            {mode === "register" ? "Создай аккаунт и начни зарабатывать" : "Войди в свой аккаунт"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <Label className="text-gray-300">Имя</Label>
              <Input
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
                placeholder="Твоё имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div>
            <Label className="text-gray-300">Email</Label>
            <Input
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
              type="email"
              placeholder="example@mail.ru"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label className="text-gray-300">Пароль</Label>
            <Input
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
              type="password"
              placeholder="Минимум 6 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 text-base"
          >
            {loading ? "Загрузка..." : mode === "register" ? "Зарегистрироваться" : "Войти"}
          </Button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => { setMode(mode === "register" ? "login" : "register"); setError("") }}
            className="text-gray-400 hover:text-red-400 text-sm transition-colors"
          >
            {mode === "register" ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
          </button>
        </div>
      </div>
    </div>
  )
}
