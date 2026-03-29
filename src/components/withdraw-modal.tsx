import { useState, useEffect } from "react"
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

type PaymentMethod = "card" | "yookassa" | "tinkoff" | "sberbank" | "sbp"

const PAYMENT_OPTIONS: { id: PaymentMethod; name: string; icon: string; color: string }[] = [
  { id: "sberbank", name: "СберБанк", icon: "🟢", color: "#21A038" },
  { id: "tinkoff", name: "Тинькофф", icon: "🟡", color: "#FFDD2D" },
  { id: "sbp", name: "СБП", icon: "⚡", color: "#7B61FF" },
  { id: "yookassa", name: "ЮKassa", icon: "💳", color: "#8B3FFD" },
  { id: "card", name: "Любая карта", icon: "💳", color: "#EF4444" },
]

const SBP_BANKS = [
  "Сбербанк", "Тинькофф", "Альфа-Банк", "ВТБ", "Газпромбанк",
  "Райффайзен", "Совкомбанк", "Россельхозбанк", "Почта Банк", "МТС Банк",
  "Озон Банк", "Яндекс Банк",
]

export function WithdrawModal({ balance, token, onClose, onSuccess }: WithdrawModalProps) {
  const [step, setStep] = useState<"method" | "details">("method")
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("sberbank")
  const [amount, setAmount] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardHolder, setCardHolder] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [bankName, setBankName] = useState("")
  const [yookassaWallet, setYookassaWallet] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [withdrawals, setWithdrawals] = useState<
    { amount: number; payment_method_name: string; status: string; created_at: string }[]
  >([])

  useEffect(() => {
    fetch(WITHDRAW_URL, {
      headers: { "X-Auth-Token": token },
    })
      .then((r) => r.json())
      .then((d) => setWithdrawals(d.withdrawals || []))
      .catch(() => {})
  }, [token])

  function formatCard(val: string) {
    return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim()
  }

  function formatPhone(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 11)
    if (digits.length === 0) return ""
    let formatted = "+7"
    if (digits.length > 1) formatted += " (" + digits.slice(1, 4)
    if (digits.length > 4) formatted += ") " + digits.slice(4, 7)
    if (digits.length > 7) formatted += "-" + digits.slice(7, 9)
    if (digits.length > 9) formatted += "-" + digits.slice(9, 11)
    return formatted
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const body: Record<string, unknown> = {
        amount: parseFloat(amount),
        payment_method: selectedMethod,
      }

      if (selectedMethod === "card" || selectedMethod === "tinkoff" || selectedMethod === "sberbank") {
        body.card_number = cardNumber.replace(/\s/g, "")
        body.card_holder = cardHolder
      } else if (selectedMethod === "yookassa") {
        body.yookassa_wallet = yookassaWallet
      } else if (selectedMethod === "sbp") {
        body.phone_number = phoneNumber.replace(/\D/g, "")
        body.bank_name = bankName
      }

      const res = await fetch(WITHDRAW_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify(body),
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

  const statusColors: Record<string, string> = {
    pending: "text-yellow-400",
    processing: "text-blue-400",
    completed: "text-green-400",
    rejected: "text-red-400",
  }

  const statusNames: Record<string, string> = {
    pending: "В обработке",
    processing: "Выполняется",
    completed: "Выплачено",
    rejected: "Отклонено",
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-8 w-full max-w-md mx-4 relative max-h-[90vh] overflow-y-auto">
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
        ) : step === "method" ? (
          <div className="space-y-3">
            <p className="text-gray-300 text-sm font-medium mb-2">Выберите способ вывода:</p>
            {PAYMENT_OPTIONS.map((pm) => (
              <button
                key={pm.id}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  selectedMethod === pm.id
                    ? "border-red-500 bg-red-500/10"
                    : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
                }`}
                onClick={() => setSelectedMethod(pm.id)}
              >
                <span className="text-2xl">{pm.icon}</span>
                <span className="text-white font-medium">{pm.name}</span>
                {selectedMethod === pm.id && (
                  <Icon name="CheckCircle" size={18} className="ml-auto text-red-500" />
                )}
              </button>
            ))}
            <Button
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 text-base mt-4"
              onClick={() => setStep("details")}
            >
              Продолжить
            </Button>

            {withdrawals.length > 0 && (
              <div className="mt-6 pt-4 border-t border-zinc-800">
                <p className="text-gray-400 text-sm font-medium mb-3">Последние выводы:</p>
                <div className="space-y-2">
                  {withdrawals.slice(0, 5).map((w, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2">
                      <div>
                        <span className="text-white text-sm font-medium">{w.amount.toFixed(2)} ₽</span>
                        <span className="text-gray-500 text-xs ml-2">{w.payment_method_name}</span>
                      </div>
                      <span className={`text-xs ${statusColors[w.status] || "text-gray-400"}`}>
                        {statusNames[w.status] || w.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1 mb-2"
              onClick={() => { setStep("method"); setError("") }}
            >
              <Icon name="ArrowLeft" size={14} />
              Назад к способам вывода
            </button>

            <div className="bg-zinc-800 rounded-xl p-3 flex items-center gap-3 mb-4">
              <span className="text-xl">{PAYMENT_OPTIONS.find((p) => p.id === selectedMethod)?.icon}</span>
              <span className="text-white font-medium">{PAYMENT_OPTIONS.find((p) => p.id === selectedMethod)?.name}</span>
            </div>

            {(selectedMethod === "card" || selectedMethod === "tinkoff" || selectedMethod === "sberbank") && (
              <>
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
              </>
            )}

            {selectedMethod === "yookassa" && (
              <div>
                <Label className="text-gray-300">Номер кошелька ЮKassa</Label>
                <Input
                  className="bg-zinc-800 border-zinc-700 text-white mt-1 font-mono"
                  placeholder="4100 0000 0000 0000"
                  value={yookassaWallet}
                  onChange={(e) => setYookassaWallet(e.target.value)}
                  required
                />
              </div>
            )}

            {selectedMethod === "sbp" && (
              <>
                <div>
                  <Label className="text-gray-300">Номер телефона</Label>
                  <Input
                    className="bg-zinc-800 border-zinc-700 text-white mt-1 font-mono"
                    placeholder="+7 (900) 000-00-00"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(formatPhone(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Банк получателя</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {SBP_BANKS.map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        className={`text-left text-sm p-2 rounded-lg border transition-all ${
                          bankName === bank
                            ? "border-red-500 bg-red-500/10 text-white"
                            : "border-zinc-700 bg-zinc-800 text-gray-400 hover:border-zinc-500"
                        }`}
                        onClick={() => setBankName(bank)}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <Label className="text-gray-300">Сумма вывода (₽)</Label>
              <Input
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
                type="number"
                placeholder="Минимум 50 ₽"
                min={50}
                max={balance}
                step={0.01}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">Минимум: 50 ₽ · Комиссия: 0%</p>
                <button
                  type="button"
                  className="text-xs text-red-400 hover:text-red-300"
                  onClick={() => setAmount(balance.toString())}
                >
                  Вывести всё
                </button>
              </div>
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

export default WithdrawModal
