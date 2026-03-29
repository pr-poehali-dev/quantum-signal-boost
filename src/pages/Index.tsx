import { useState, useEffect } from "react"
import { Hero3DWebGL as Hero3D } from "@/components/hero-webgl"
import { FeaturesSection } from "@/components/features-section"
import { TechnologySection } from "@/components/technology-section"
import { ApplicationsTimeline } from "@/components/applications-timeline"
import { AboutSection } from "@/components/about-section"
import { SafetySection } from "@/components/safety-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { FAQSection } from "@/components/faq-section"
import { CTASection } from "@/components/cta-section"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AuthModal } from "@/components/auth-modal"
import { Dashboard } from "@/components/dashboard"

const AUTH_URL = "https://functions.poehali.dev/09bb8cdd-7dcc-470d-a8a0-a2383d82ad84"

interface User {
  id: number
  name: string
  email: string
  balance: number
  total_earned?: number
}

export default function Index() {
  const [showAuth, setShowAuth] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem("token")
    if (!savedToken) { setChecking(false); return }
    fetch(AUTH_URL, { headers: { "X-Auth-Token": savedToken } })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) { setUser(d.user); setToken(savedToken) }
        else localStorage.removeItem("token")
      })
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setChecking(false))
  }, [])

  function handleAuthSuccess(t: string, u: User) {
    setToken(t)
    setUser(u)
    setShowAuth(false)
  }

  function handleLogout() {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-orbitron animate-pulse">Загрузка...</div>
      </div>
    )
  }

  if (user && token) {
    return <Dashboard user={user} token={token} onLogout={handleLogout} />
  }

  return (
    <div className="dark">
      <Navbar onStartEarning={() => setShowAuth(true)} />
      <main>
        <Hero3D onStartEarning={() => setShowAuth(true)} />
        <FeaturesSection />
        <section id="technology">
          <TechnologySection />
        </section>
        <ApplicationsTimeline />
        <AboutSection />
        <section id="safety">
          <SafetySection />
        </section>
        <TestimonialsSection />
        <section id="faq">
          <FAQSection />
        </section>
        <CTASection onStartEarning={() => setShowAuth(true)} />
      </main>
      <Footer />
      {showAuth && (
        <AuthModal onSuccess={handleAuthSuccess} onClose={() => setShowAuth(false)} />
      )}
    </div>
  )
}
