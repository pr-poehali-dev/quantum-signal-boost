import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"

const WITHDRAW_URL = "https://functions.poehali.dev/5469cc9a-2d03-47ce-ac10-943851dfcc61"

interface WithdrawModalProps {
  balance: number
  token: string
  onClose: () => void
  onSuccess: (newBalance: number) => void
}

export function WithdrawModal({ balance, token, onClose, onSuccess }: WithdrawModalProps) {
  const [amount, setAmount] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardHolder, setCardHolder] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  function formatCard(val: string) {
    return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch(WITHDRAW_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({
          amount: parseFloat(amount),
          card_number: cardNumber.replace(/\s/g, ""),
          card_holder: cardHolder,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Ошибка")
      setSuccess(data.message)
      onSuccess(data.new_balance)
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
          <h2 className="text-2xl font-bold text-white font-orbitron">Вывод средств</h2>
          <p className="text-gray-400 mt-1 text-sm">
            Доступно: <span className="text-green-400 font-bold">{balance.toFixed(2)} ₽</span>
          </p>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-green-400 font-bold text-lg">{success}</p>
            <Button onClick={onClose} className="mt-6 bg-red-500 hover:bg-red-600 text-white">
              Закрыть
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-gray-300">Номер карты</Label>
              <Input
                className="bg-zinc-800 border-zinc-700 text-white mt-1 font-mono tracking-widest"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCard(e.target.value))}
                required
              />
            </div>
            <div>
              <Label className="text-gray-300">Имя владельца карты</Label>
              <Input
                className="bg-zinc-800 border-zinc-700 text-white mt-1 uppercase"
                placeholder="IVAN IVANOV"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div>
              <Label className="text-gray-300">Сумма вывода (₽)</Label>
              <Input
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
                type="number"
                placeholder="Минимум 500 ₽"
                min={500}
                max={balance}
                step={0.01}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Минимальная сумма: 500 ₽</p>
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
              {loading ? "Обработка..." : "Вывести деньги"}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
