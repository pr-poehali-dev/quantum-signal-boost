import { useState, useEffect, useRef } from "react"
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
  video_url: string
  color: string
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
  const [watchedIds, setWatchedIds] = useState<number[]>([])
  const [completing, setCompleting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch(WATCH_AD_URL)
      .then((r) => r.json())
      .then((d) => setAds(d.ads || []))
  }, [])

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
        setWatchedIds((prev) => [...prev, ad.id])
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
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

      {/* Main content */}
      <div className="pt-24 pb-16 max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold font-orbitron mb-2">
            Привет, {user.name}! 👋
          </h2>
          <p className="text-gray-400">Выбери рекламу и заработай деньги прямо сейчас</p>
        </div>

        {/* Balance card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-gradient-to-br from-red-500/20 to-red-900/10 border border-red-500/30 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-1">Текущий баланс</p>
            <p className="text-4xl font-bold text-white">{balance.toFixed(2)} <span className="text-xl text-red-400">₽</span></p>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-900/10 border border-green-500/30 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-1">Просмотрено реклам</p>
            <p className="text-4xl font-bold text-white">{watchedIds.length}</p>
          </div>
        </div>

        {/* Ads grid */}
        <h3 className="text-xl font-bold mb-4 font-orbitron text-gray-200">Доступная реклама</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ads.map((ad) => {
            const watched = watchedIds.includes(ad.id)
            return (
              <div
                key={ad.id}
                className="bg-zinc-900 border border-zinc-700 hover:border-red-500/40 rounded-2xl p-5 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">{ad.brand}</span>
                    <h4 className="text-white font-semibold mt-0.5">{ad.title}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold text-lg">+{(ad.reward * 0.5).toFixed(0)} ₽</div>
                    <div className="text-xs text-gray-500">{ad.duration} сек</div>
                  </div>
                </div>
                <Button
                  className={`w-full ${watched ? "bg-zinc-700 text-gray-400 cursor-default" : "bg-red-500 hover:bg-red-600 text-white"}`}
                  onClick={() => !watched && startAd(ad)}
                  disabled={watched}
                >
                  {watched ? (
                    <><Icon name="CheckCircle" size={16} className="mr-2" />Просмотрено</>
                  ) : (
                    <><Icon name="Play" size={16} className="mr-2" />Смотреть рекламу</>
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ad player modal */}
      {playingAd && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">{playingAd.brand}</p>
                <h3 className="text-white font-bold">{playingAd.title}</h3>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-bold">+{(playingAd.reward * 0.5).toFixed(0)} ₽</div>
              </div>
            </div>

            <video
              ref={videoRef}
              src={playingAd.video_url}
              autoPlay
              muted
              className="w-full rounded-xl mb-4 bg-black aspect-video object-cover"
            />

            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Просмотр...</span>
                <span>{watchProgress}/{playingAd.duration} сек</span>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(watchProgress / playingAd.duration) * 100}%` }}
                />
              </div>
            </div>

            {watchProgress < playingAd.duration ? (
              <p className="text-center text-gray-400 text-sm">
                ⏳ Досмотри до конца, чтобы получить деньги
              </p>
            ) : (
              <div className="text-center">
                <p className="text-green-400 font-bold text-lg mb-3">
                  ✅ +{(playingAd.reward * 0.5).toFixed(0)} ₽ зачислено!
                </p>
                <Button onClick={closeAd} className="bg-red-500 hover:bg-red-600 text-white">
                  Закрыть
                </Button>
              </div>
            )}

            {watchProgress < playingAd.duration && (
              <button
                onClick={closeAd}
                className="mt-3 w-full text-center text-xs text-gray-600 hover:text-gray-400"
              >
                Отмена (деньги не будут начислены)
              </button>
            )}
          </div>
        </div>
      )}

      {showWithdraw && (
        <WithdrawModal
          balance={balance}
          token={token}
          onClose={() => setShowWithdraw(false)}
          onSuccess={(nb) => { setBalance(nb); setShowWithdraw(false) }}
        />
      )}
    </div>
  )
}
