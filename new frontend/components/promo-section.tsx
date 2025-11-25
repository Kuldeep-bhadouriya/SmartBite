"use client"

import { Zap, Gift, TrendingUp } from "lucide-react"

export default function PromoSection() {
  return (
    <section className="py-8 md:py-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Promo Card 1 */}
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 md:p-8 text-primary-foreground overflow-hidden relative group hover:shadow-lg transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition"></div>
            <div className="relative z-10 space-y-3">
              <Zap size={28} />
              <h3 className="font-bold text-xl md:text-2xl leading-tight">Plan Your Week & Save 20%</h3>
              <p className="text-primary-foreground/90 text-sm md:text-base">Schedule all your meals for the week</p>
              <button className="mt-4 px-4 py-2 bg-primary-foreground text-primary rounded-lg font-semibold text-sm hover:bg-primary-foreground/90 transition">
                Plan Week
              </button>
            </div>
          </div>

          {/* Promo Card 2 */}
          <div className="bg-gradient-to-br from-accent to-accent/80 rounded-2xl p-6 md:p-8 text-accent-foreground overflow-hidden relative group hover:shadow-lg transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition"></div>
            <div className="relative z-10 space-y-3">
              <TrendingUp size={28} />
              <h3 className="font-bold text-xl md:text-2xl leading-tight">7-Day Streak Active</h3>
              <p className="text-accent-foreground/90 text-sm md:text-base">1 more order for 5% off!</p>
              <button className="mt-4 px-4 py-2 bg-accent-foreground text-accent rounded-lg font-semibold text-sm hover:bg-accent-foreground/90 transition">
                Order Now
              </button>
            </div>
          </div>

          {/* Promo Card 3 */}
          <div className="bg-gradient-to-br from-accent to-accent/70 rounded-2xl p-6 md:p-8 text-accent-foreground overflow-hidden relative group hover:shadow-lg transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition"></div>
            <div className="relative z-10 space-y-3">
              <Gift size={28} />
              <h3 className="font-bold text-xl md:text-2xl leading-tight">Subscribe & Save More</h3>
              <p className="text-accent-foreground/90 text-sm md:text-base">Up to ₹500/week savings</p>
              <button className="mt-4 px-4 py-2 bg-accent-foreground text-accent rounded-lg font-semibold text-sm hover:bg-accent-foreground/90 transition">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
