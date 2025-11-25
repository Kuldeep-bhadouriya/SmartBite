"use client"

import { ArrowRight, Clock, Leaf } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Hero() {
  const router = useRouter()

  return (
    <section className="relative bg-gradient-to-br from-muted to-muted/50 py-12 md:py-24 overflow-hidden">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-50">
        <source
          src="https://b.zmtcdn.com/data/file_assets/2627bbed9d6c068e50d2aadcca11ddbb1743095925.mp4"
          type="video/mp4"
        />
      </video>

      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/40"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-center items-center min-h-[500px]">
          {/* Center Content */}
          <div className="space-y-6 text-center max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <Leaf size={16} />
              <span>Fresh & Predictable</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Plan Your Meals.
              <span className="text-primary"> Eat Fresh.</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Schedule meals up to 2 days in advance, track nutrition with AI, and enjoy guaranteed fresh delivery
              within your chosen time slot.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">
              <button
                onClick={() => router.push("/discover")}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-semibold flex items-center justify-center gap-2 text-base"
              >
                Order Now
                <ArrowRight size={20} />
              </button>
              <button
                onClick={() => router.push("/plans")}
                className="px-6 py-3 border-2 border-border text-foreground rounded-lg hover:bg-muted transition font-semibold text-base"
              >
                Plan Weekly
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-4 flex items-center gap-6 text-sm text-muted-foreground justify-center">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
                  <Clock size={18} className="text-accent" />
                </div>
                <span>On-time delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
                  <Leaf size={18} className="text-accent" />
                </div>
                <span>Fresh guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
