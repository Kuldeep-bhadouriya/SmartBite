"use client"

import { Zap, TrendingUp, Users, Leaf, Shield, Clock } from "lucide-react"

const features = [
  {
    icon: Clock,
    title: "Predictable Delivery",
    description: "Choose your exact 1-hour delivery window. We guarantee on-time arrival.",
  },
  {
    icon: Leaf,
    title: "Freshness Guaranteed",
    description: "Meals prepared just-in-time, reaching you at peak freshness.",
  },
  {
    icon: TrendingUp,
    title: "Nutrition Tracking",
    description: "AI-powered macro tracking and personalized meal recommendations.",
  },
  {
    icon: Users,
    title: "Group Ordering",
    description: "Coordinate meals with your team, office, or friends seamlessly.",
  },
  {
    icon: Zap,
    title: "Smart Subscriptions",
    description: "Save 15-20% with weekly meal plans tailored to your goals.",
  },
  {
    icon: Shield,
    title: "Quality Assured",
    description: "Every meal rated, reviewed, and guaranteed fresh with our seal.",
  },
]

export default function FeaturesSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">Why Choose NexMeal?</h2>
          <p className="text-lg text-muted-foreground">
            We're reimagining food delivery for a health-conscious, planned future
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={idx}
                className="bg-card rounded-2xl p-6 md:p-8 space-y-4 hover:shadow-lg transition border border-border hover:border-primary group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition">
                  <Icon size={24} />
                </div>
                <h3 className="font-bold text-lg md:text-xl text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-primary to-accent rounded-3xl p-8 md:p-12 text-primary-foreground text-center space-y-6">
          <h3 className="text-3xl md:text-4xl font-bold">Ready to Transform Your Meals?</h3>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Join thousands already enjoying planned, fresh, delicious meals delivered to their door.
          </p>
          <button className="px-8 py-3 bg-primary-foreground text-primary rounded-xl font-semibold hover:bg-primary-foreground/90 transition inline-block">
            Start Ordering Today
          </button>
        </div>
      </div>
    </section>
  )
}
