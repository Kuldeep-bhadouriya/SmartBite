"use client"

import { useRouter } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { ShoppingCart, Minus, Plus, X, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { useState } from "react"

export default function Cart() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, removeItem, updateQuantity, clearCart, total } = useCart()
  const [loading, setLoading] = useState(false)

  if (!user) {
    router.push("/signin")
    return null
  }

  const groupedByRestaurant = items.reduce(
    (acc, item) => {
      if (!acc[item.restaurantId]) {
        acc[item.restaurantId] = { name: item.restaurantName, items: [] }
      }
      acc[item.restaurantId].items.push(item)
      return acc
    },
    {} as Record<string, { name: string; items: typeof items }>,
  )

  const handleCheckout = async () => {
    router.push("/payment")
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <Header />

        <div className="flex-1 py-12 px-4 flex items-center justify-center">
          <div className="text-center">
            <ShoppingCart size={64} className="mx-auto text-muted-foreground mb-4 opacity-50" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Shopping Cart</h1>
            <p className="text-muted-foreground mb-6">Your cart is empty. Add items from restaurants to get started!</p>
            <Link
              href="/"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium inline-block"
            >
              Browse Restaurants
            </Link>
          </div>
        </div>

        <Footer />
      </main>
    )
  }

  const tax = Math.round(total * 0.1)
  const delivery = 40
  const finalTotal = total + tax + delivery

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 py-8 md:py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg transition">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Your Cart</h1>
          </div>

          {/* Cart Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {Object.entries(groupedByRestaurant).map(([restaurantId, restaurant]) => (
                <div key={restaurantId} className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
                  {/* Restaurant Header */}
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-4 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">{restaurant.name}</h2>
                  </div>

                  {/* Items */}
                  <div className="space-y-3 p-6">
                    {restaurant.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                        <div className="text-4xl flex-shrink-0">{item.image || "🍽️"}</div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">{item.mealName}</h3>
                          <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                        </div>

                        <div className="flex items-center gap-2 bg-primary/10 rounded-lg p-2 flex-shrink-0">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-primary/20 rounded transition"
                          >
                            <Minus size={16} className="text-primary" />
                          </button>
                          <span className="w-6 text-center font-semibold text-primary">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-primary/20 rounded transition"
                          >
                            <Plus size={16} className="text-primary" />
                          </button>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-primary">₹{item.price * item.quantity}</p>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-destructive hover:bg-destructive/10 p-1 rounded transition mt-1"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Apply Coupon */}
              <div className="bg-card rounded-2xl border border-border shadow-lg p-6">
                <h3 className="font-semibold text-foreground mb-4">Have a coupon?</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    className="flex-1 px-4 py-3 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium">
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl border border-border shadow-lg p-6 sticky top-24 space-y-4">
                <h3 className="font-bold text-foreground text-lg">Order Summary</h3>

                <div className="space-y-3 border-b border-border pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold text-foreground">₹{total}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className="font-semibold text-foreground">₹{delivery}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (10%)</span>
                    <span className="font-semibold text-foreground">₹{tax}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">Total Amount</span>
                  <span className="font-bold text-primary text-2xl">₹{finalTotal}</span>
                </div>

                <div className="bg-secondary/10 rounded-lg p-3 text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Delivery Details</p>
                  <p>Estimated delivery time: 30-45 minutes</p>
                  <p>Free delivery on orders above ₹300</p>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold rounded-lg hover:from-primary/90 hover:to-primary/70 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Proceed to Checkout"}
                </button>

                <button
                  onClick={() => router.push("/")}
                  className="w-full py-3 border border-border text-foreground rounded-lg hover:bg-muted transition font-medium"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
