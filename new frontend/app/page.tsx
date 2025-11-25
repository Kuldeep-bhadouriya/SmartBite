"use client"

import { useAuth } from "@/lib/auth-context"
import Header from "@/components/header"
import Hero from "@/components/hero"
import PromoSection from "@/components/promo-section"
import FeaturesSection from "@/components/features-section"
import StreakBanner from "@/components/streak-banner"
import Footer from "@/components/footer"

export default function Home() {
  const { user } = useAuth()

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <PromoSection />
      <StreakBanner />
      <FeaturesSection />
      <Footer />
    </main>
  )
}
