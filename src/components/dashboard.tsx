import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { WithdrawModal } from "@/components/withdraw-modal"
import Icon from "@/components/ui/icon"

const WATCH_AD_URL = "https://functions.poehali.dev/dd52b21f-31ae-4b3a-880a-a208b47bab34"

interface Ad {
  id: number
  title: string
  brand: string
  duration: number
  reward: number
  color: string
  icon?: string
  user_reward?: number
  description?: string
  category?: string
}

interface User {
  id: number
  name: string
  email: string
  balance: number
  total_earned?: number
}

interface DashboardProps {
  user: User
  token: string
  onLogout: () => void
}

export function Dashboard({ user, token, onLogout }: DashboardProps) {
  const [balance, setBalance] = useState(user.balance)
  const [ads, setAds] = useState<Ad[]>([])
  const [playingAd, setPlayingAd] = useState<Ad | null>(null)
  const [watchProgress, setWatchProgress] = useState(0)
  const [lastEarned, setLastEarned] = useState<number | null>(null)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [watchedCount, setWatchedCount] = useState(0)
  const [completing, setCompleting] = useState(false)
  const [totalAvailable, setTotalAvailable] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadAds = useCallback(() => {
    setRefreshing(true)
    fetch(`${WATCH_AD_URL}?count=6&t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => {
        setAds(d.ads || [])
        setTotalAvailable(d.total_available || 0)
      })
      .finally(() => setRefreshing(false))
  }, [])

  useEffect(() => {
    loadAds()
  }, [loadAds])

  function startAd(ad: Ad) {
    setPlayingAd(ad)
    setWatchProgress(0)
    setLastEarned(null)
  }

  useEffect(() => {
    if (!playingAd) return
    if (timerRef.current) clearInterval(timerRef.current)
    setWatchProgress(0)
    timerRef.current = setInterval(() => {
      setWatchProgress((prev) => {
        const next = prev + 1
        if (next >= playingAd.duration) {
          clearInterval(timerRef.current!)
          completeAd(playingAd)
          return playingAd.duration
        }
        return next
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [playingAd])

  async function completeAd(ad: Ad) {
    if (completing) return
    setCompleting(true)
    try {
      const res = await fetch(WATCH_AD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ ad_id: ad.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setBalance(data.new_balance)
        setLastEarned(data.earned)
        setWatchedCount((prev) => prev + 1)
      }
    } finally {
      setCompleting(false)
      setPlayingAd(null)
    }
  }

  function closeAd() {
    if (timerRef.current) clearInterval(timerRef.current)
    setPlayingAd(null)
    setWatchProgress(0)
  }

  function handleRefreshAds() {
    loadAds()
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur border-b border-red-500/20 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="font-orbitron text-lg font-bold text-white">
            Don<span className="text-red-500">PatchYY</span>easymoney
          </h1>
          <div className="flex items-center gap-3">
            {lastEarned !== null && (
              <div className="bg-green-500/20 border border-green-500/40 rounded-full px-3 py-1 text-green-400 text-sm font-bold animate-pulse">
                +{lastEarned.toFixed(2)} ₽
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              className="border-red-500/40 text-red-400 hover:bg-red-500/10 bg-transparent"
              onClick={() => setShowWithdraw(true)}
            >
              <Icon name="ArrowDownToLine" size={15} className="mr-1" />
              Вывод
            </Button>
            <div className="bg-red-500/20 border border-red-500/40 rounded-full px-4 py-1 font-bold text-white">
              {balance.toFixed(2)} ₽
            </div>
            <button onClick={onLogout} className="text-gray-500 hover:text-gray-300 ml-1">
              <Icon name="LogOut" size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-24 pb-16 max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold font-orbitron mb-2">
            Привет, {user.name}! 👋
          </h2>
          <p className="text-gray-400">Выбери рекламу и заработай деньги прямо сейчас</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-gradient-to-br from-red-500/20 to-red-900/10 border border-red-500/30 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-1">Текущий баланс</p>
            <p className="text-4xl font-bold text-white">{balance.toFixed(2)} <span className="text-xl text-red-400">₽</span></p>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-900/10 border border-green-500/30 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-1">Просмотрено реклам</p>
            <p className="text-4xl font-bold text-white">{watchedCount}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-900/10 border border-blue-500/30 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-1">Рекламодателей</p>
            <p className="text-4xl font-bold text-white">{totalAvailable}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold font-orbitron text-gray-200">Доступная реклама</h3>
          <Button
            size="sm"
            variant="outline"
            className="border-zinc-700 text-gray-400 hover:text-white hover:border-red-500/40 bg-transparent"
            onClick={handleRefreshAds}
            disabled={refreshing}
          >
            <Icon name="RefreshCw" size={15} className={`mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Обновить
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad) => (
            <div
              key={`${ad.id}-${Math.random()}`}
              className="bg-zinc-900 border border-zinc-700 hover:border-red-500/40 rounded-2xl p-5 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{ad.icon || "📺"}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wide truncate">{ad.brand}</span>
                  </div>
                  <h4 className="text-white font-semibold text-sm leading-tight">{ad.title}</h4>
                  {ad.description && (
                    <p className="text-xs text-gray-500 mt-1">{ad.description}</p>
                  )}
                </div>
                <div className="text-right ml-3 shrink-0">
                  <div className="text-green-400 font-bold text-lg">+{(ad.user_reward || ad.reward * 0.5).toFixed(0)} ₽</div>
                  <div className="text-xs text-gray-500">{ad.duration} сек</div>
                </div>
              </div>
              <div
                className="w-full h-1 rounded-full mb-3"
                style={{ backgroundColor: ad.color + "40" }}
              >
                <div
                  className="h-1 rounded-full"
                  style={{ backgroundColor: ad.color, width: "100%" }}
                />
              </div>
              <Button
                className="w-full bg-red-500 hover:bg-red-600 text-white"
                onClick={() => startAd(ad)}
              >
                <Icon name="Play" size={16} className="mr-2" />
                Смотреть рекламу
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm mb-3">Показано {ads.length} из {totalAvailable} рекламных предложений</p>
          <Button
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent"
            onClick={handleRefreshAds}
            disabled={refreshing}
          >
            <Icon name="RefreshCw" size={16} className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Загрузить новые предложения
          </Button>
        </div>
      </div>

      {playingAd && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{playingAd.icon || "📺"}</span>
                <div>
                  <p className="text-xs text-gray-500 uppercase">{playingAd.brand}</p>
                  <h3 className="text-white font-bold">{playingAd.title}</h3>
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-bold">+{(playingAd.user_reward || playingAd.reward * 0.5).toFixed(0)} ₽</div>
              </div>
            </div>

            <div className="w-full rounded-xl mb-4 bg-gradient-to-br from-zinc-800 to-zinc-900 aspect-video flex items-center justify-center border border-zinc-700" style={{ borderColor: playingAd.color + "60" }}>
              <div className="text-center">
                <div className="text-6xl mb-3">{playingAd.icon || "📺"}</div>
                <p className="text-white font-bold text-xl">{playingAd.brand}</p>
                <p className="text-gray-400 text-sm mt-1">{playingAd.description || playingAd.title}</p>
                <div className="mt-4 px-6 py-2 rounded-full text-sm font-bold" style={{ backgroundColor: playingAd.color + "30", color: playingAd.color }}>
                  Рекламное объявление
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Просмотр рекламы...</span>
                <span>{watchProgress}/{playingAd.duration} сек</span>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-1000"
                  style={{
                    width: `${(watchProgress / playingAd.duration) * 100}%`,
                    backgroundColor: playingAd.color,
                  }}
                />
              </div>
            </div>

            {watchProgress >= playingAd.duration ? (
              <div className="text-center py-2">
                <p className="text-green-400 font-bold text-lg mb-2">
                  ✅ +{(playingAd.user_reward || playingAd.reward * 0.5).toFixed(2)} ₽ начислено!
                </p>
              </div>
            ) : (
              <Button variant="ghost" className="w-full text-gray-500 hover:text-gray-300" onClick={closeAd}>
                Закрыть (деньги не будут начислены)
              </Button>
            )}
          </div>
        </div>
      )}

      {showWithdraw && (
        <WithdrawModal
          balance={balance}
          token={token}
          onClose={() => setShowWithdraw(false)}
          onSuccess={(newBalance) => setBalance(newBalance)}
        />
      )}
    </div>
  )
}

export default Dashboard
