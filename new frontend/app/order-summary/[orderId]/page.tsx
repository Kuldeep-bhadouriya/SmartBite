"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { ArrowLeft, Download, Share2 } from "lucide-react"

interface Order {
  id: string
  restaurantName: string
  items: any[]
  total: number
  subtotal: number
  tax: number
  delivery: number
  status: string
  createdAt: string
  paymentMethod: string
}

export default function OrderSummary() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    const orders = JSON.parse(localStorage.getItem("nexmeal_orders") || "[]")
    const found = orders.find((o: Order) => o.id === orderId)
    if (found) {
      setOrder(found)
    }
  }, [orderId])

  if (!order) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Loading order summary...</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 py-8 md:py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg transition">
              <ArrowLeft size={24} className="text-foreground" />
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Order Summary</h1>
          </div>

          {/* Bill */}
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="text-center border-b border-border pb-6 space-y-2">
              <h2 className="text-2xl font-bold text-foreground">NexMeal</h2>
              <p className="text-muted-foreground">Order Invoice</p>
            </div>

            {/* Order Info */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-bold text-foreground">{order.id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="font-bold text-foreground">
                  {new Date(order.createdAt).toLocaleDateString([], {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Restaurant</p>
                <p className="font-bold text-foreground">{order.restaurantName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-bold text-accent capitalize">{order.status}</p>
              </div>
            </div>

            {/* Items */}
            <div className="border-t border-b border-border py-6">
              <h3 className="font-bold text-foreground mb-4">Items Ordered</h3>
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2">
                    <div>
                      <p className="font-medium text-foreground">{item.mealName}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">₹{item.price}</p>
                      <p className="text-sm text-muted-foreground">Subtotal: ₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="font-semibold text-foreground">₹{order.delivery}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span className="font-semibold text-foreground">₹{order.tax}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between items-center">
                <span className="font-bold text-foreground text-lg">Total Amount</span>
                <span className="font-bold text-primary text-2xl">₹{order.total}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Payment Method</p>
              <p className="text-foreground font-semibold capitalize">{order.paymentMethod}</p>
              <p className="text-xs text-muted-foreground">Transaction completed successfully</p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
              <button className="py-3 px-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition font-medium flex items-center justify-center gap-2">
                <Download size={18} />
                <span>Download</span>
              </button>
              <button className="py-3 px-4 border border-border hover:bg-muted text-foreground rounded-lg transition font-medium flex items-center justify-center gap-2">
                <Share2 size={18} />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 space-y-4">
            <button
              onClick={() => router.push("/orders")}
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium"
            >
              Back to Orders
            </button>
            <p className="text-sm text-muted-foreground">Thank you for your order! Enjoy your meal!</p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
