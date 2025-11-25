"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { ArrowLeft, CreditCard, Smartphone, Banknote, CheckCircle } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"

export default function Payment() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, total, clearCart } = useCart()
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [orderCreated, setOrderCreated] = useState(false)

  if (!user) {
    router.push("/signin")
    return null
  }

  if (items.length === 0) {
    router.push("/cart")
    return null
  }

  const tax = Math.round(total * 0.1)
  const delivery = 40
  const finalTotal = total + tax + delivery

  const handlePayment = async () => {
    if (!paymentMethod) {
      alert("Please select a payment method")
      return
    }

    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const order = {
        id: `ORD${Date.now()}`,
        items: items,
        total: finalTotal,
        subtotal: total,
        tax: tax,
        delivery: delivery,
        paymentMethod: paymentMethod,
        status: "confirmed",
        createdAt: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 45 * 60000).toISOString(),
        restaurantId: items[0]?.restaurantId,
        restaurantName: items[0]?.restaurantName,
      }

      const orders = JSON.parse(localStorage.getItem("nexmeal_orders") || "[]")
      orders.push(order)
      localStorage.setItem("nexmeal_orders", JSON.stringify(orders))

      clearCart()
      setOrderCreated(true)

      setTimeout(() => {
        router.push(`/tracking/${order.id}`)
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  if (orderCreated) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="text-center max-w-md">
            <div className="mb-6 flex justify-center">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 bg-accent/20 rounded-full animate-pulse"></div>
                <div
                  className="absolute inset-2 bg-accent/40 rounded-full animate-pulse"
                  style={{ animationDelay: "0.3s" }}
                ></div>
                <CheckCircle size={80} className="relative text-accent" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-4">Your order has been placed successfully</p>
            <p className="text-sm text-muted-foreground">Redirecting to live tracking...</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  const paymentOptions = [
    {
      id: "upi",
      name: "UPI",
      description: "Google Pay, PhonePe, Paytm",
      icon: Smartphone,
      color: "from-blue-500 to-purple-500",
    },
    {
      id: "card",
      name: "Credit/Debit Card",
      description: "Visa, Mastercard, American Express",
      icon: CreditCard,
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "cod",
      name: "Cash on Delivery",
      description: "Pay when you receive your order",
      icon: Banknote,
      color: "from-orange-500 to-red-500",
    },
  ]

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 py-8 md:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg transition">
              <ArrowLeft size={24} className="text-foreground" />
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Payment Method</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Options */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-2xl border border-border shadow-lg p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Select Payment Method</h2>

                <div className="space-y-4">
                  {paymentOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <button
                        key={option.id}
                        onClick={() => setPaymentMethod(option.id)}
                        className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                          paymentMethod === option.id
                            ? `border-primary bg-primary/5`
                            : `border-border hover:border-primary/50 bg-card`
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-4 rounded-lg bg-gradient-to-br ${option.color} text-white`}>
                            <Icon size={24} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-foreground">{option.name}</h3>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === option.id ? "border-primary bg-primary" : "border-border"
                            }`}
                          >
                            {paymentMethod === option.id && (
                              <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Payment Details */}
              {paymentMethod && (
                <div className="bg-card rounded-2xl border border-border shadow-lg p-6 space-y-4">
                  <h3 className="font-bold text-foreground text-lg">
                    {paymentMethod === "upi" && "Enter UPI ID"}
                    {paymentMethod === "card" && "Card Details"}
                    {paymentMethod === "cod" && "Delivery Address"}
                  </h3>

                  {paymentMethod === "upi" && (
                    <input
                      type="text"
                      placeholder="yourname@upi"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  )}

                  {paymentMethod === "card" && (
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        className="w-full px-4 py-3 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength="5"
                          className="px-4 py-3 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <input
                          type="text"
                          placeholder="CVV"
                          maxLength="3"
                          className="px-4 py-3 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Cardholder Name"
                        className="w-full px-4 py-3 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  )}

                  {paymentMethod === "cod" && (
                    <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-2">Delivery Address:</p>
                      <p>{user.address || "123 Main Street, Your City"}</p>
                      <p className="text-xs mt-2 text-accent">You'll pay ₹{finalTotal} when the order is delivered</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl border border-border shadow-lg p-6 sticky top-24 space-y-4">
                <h3 className="font-bold text-foreground text-lg">Order Summary</h3>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.mealName} × {item.quantity}
                      </span>
                      <span className="font-semibold text-foreground">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold text-foreground">₹{total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="font-semibold text-foreground">₹{delivery}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (10%)</span>
                    <span className="font-semibold text-foreground">₹{tax}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 flex justify-between items-center">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-bold text-primary text-2xl">₹{finalTotal}</span>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={!paymentMethod || loading}
                  className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold rounded-lg hover:from-primary/90 hover:to-primary/70 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing Payment..." : "Confirm Payment"}
                </button>

                <button
                  onClick={() => router.back()}
                  className="w-full py-3 border border-border text-foreground rounded-lg hover:bg-muted transition font-medium"
                >
                  Back to Cart
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
