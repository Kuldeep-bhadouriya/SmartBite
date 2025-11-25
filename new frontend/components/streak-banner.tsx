"use client"

import { Flame, Gift, Target } from "lucide-react"

export default function StreakBanner() {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-orange-50 dark:from-orange-950/30 to-red-50 dark:to-red-950/30 border-2 border-orange-200 dark:border-orange-800 rounded-3xl p-6 md:p-10 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Flame size={24} className="text-orange-500" />
              <h3 className="text-2xl md:text-3xl font-bold text-foreground">Your Meal Streak</h3>
            </div>
            <p className="text-muted-foreground text-base md:text-lg">
              Keep your momentum going and unlock amazing rewards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Current Streak */}
            <div className="bg-card rounded-2xl p-6 space-y-3 border-2 border-orange-200 dark:border-orange-800">
              <div className="text-5xl font-bold text-primary">7</div>
              <p className="text-muted-foreground font-medium">Days Active</p>
              <div className="h-2 bg-orange-100 dark:bg-orange-950 rounded-full overflow-hidden">
                <div className="h-full w-7/10 bg-primary rounded-full"></div>
              </div>
              <p className="text-xs text-muted-foreground">3 more days for next reward</p>
            </div>

            {/* Rewards Progress */}
            <div className="bg-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Gift size={20} className="text-accent" />
                <p className="font-semibold text-foreground">Next Milestone</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">10-day streak</span>
                  <span className="font-bold text-accent">FREE BEVERAGE</span>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Target size={20} className="text-purple-500" />
                <p className="font-semibold text-foreground">Leaderboard</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Your Rank</span>
                  <span className="font-bold text-foreground">247 / 15,342</span>
                </div>
                <p className="text-xs text-accent">You're in the top 2%!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
