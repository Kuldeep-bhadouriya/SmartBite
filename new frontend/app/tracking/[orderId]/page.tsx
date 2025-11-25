"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { MapPin, Clock, Truck, CheckCircle, ArrowLeft, Phone, MessageCircle } from "lucide-react"

interface Order {
  id: string
  restaurantName: string
  items: any[]
  total: number
  status: string
  createdAt: string
  estimatedDelivery: string
  paymentMethod: string
  subtotal: number
  tax: number
  delivery: number
}

export default function LiveTracking() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string
  const [order, setOrder] = useState<Order | null>(null)
  const [deliveryPartner, setDeliveryPartner] = useState({
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    rating: 4.8,
    vehicle: "Honda Activa (KA-05-AB-1234)",
    eta: new Date(Date.now() + 12 * 60000), // 12 minutes from now
  })

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
            <p className="text-muted-foreground">Loading order...</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  const timelineSteps = [
    { label: "Order Confirmed", time: order.createdAt, completed: true, icon: CheckCircle },
    { label: "Preparing", time: new Date(Date.now() - 5 * 60000).toISOString(), completed: true, icon: Clock },
    { label: "Picked Up", time: new Date(Date.now() - 2 * 60000).toISOString(), completed: true, icon: Truck },
    { label: "On the Way", time: new Date().toISOString(), completed: true, icon: MapPin },
    { label: "Delivered", time: deliveryPartner.eta.toISOString(), completed: false, icon: CheckCircle },
  ]

  const etaMinutes = Math.floor((deliveryPartner.eta.getTime() - Date.now()) / 60000)

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
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Live Tracking</h1>
              <p className="text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Map Section */}
              <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 h-64 md:h-96 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2230%22 cy=%2220%22 r=%222%22 fill=%22%23FFD700%22 opacity=%220.1%22/><circle cx=%2270%22 cy=%2280%22 r=%222%22 fill=%22%2310B981%22 opacity=%220.1%22/><line x1=%2230%22 y1=%2220%22 x2=%2270%22 y2=%2280%22 stroke=%22%23FFD700%22 strokeWidth=%220.5%22 opacity=%220.2%22/></svg>')]"></div>
                  <div className="relative text-center space-y-3">
                    <div className="text-5xl">🗺️</div>
                    <p className="text-muted-foreground">Live map integration</p>
                    <p className="text-sm text-muted-foreground">Your delivery partner is {etaMinutes} minutes away</p>
                  </div>
                </div>
              </div>

              {/* Delivery Partner Card */}
              <div className="bg-card rounded-2xl border border-border shadow-lg p-6 space-y-6">
                <h2 className="text-xl font-bold text-foreground">Your Delivery Partner</h2>

                <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                  <div className="text-4xl">👨‍💼</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{deliveryPartner.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <span>⭐ {deliveryPartner.rating}</span>
                      <span>•</span>
                      <span>{deliveryPartner.vehicle}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button className="p-4 bg-primary/10 hover:bg-primary/20 rounded-lg transition text-center">
                    <Phone size={20} className="mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium text-foreground">Call</p>
                  </button>
                  <button className="p-4 bg-accent/10 hover:bg-accent/20 rounded-lg transition text-center">
                    <MessageCircle size={20} className="mx-auto mb-2 text-accent" />
                    <p className="text-sm font-medium text-foreground">Message</p>
                  </button>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-card rounded-2xl border border-border shadow-lg p-6 space-y-6">
                <h2 className="text-xl font-bold text-foreground">Delivery Timeline</h2>

                <div className="space-y-6">
                  {timelineSteps.map((step, index) => {
                    const Icon = step.icon
                    return (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`p-3 rounded-full ${
                              step.completed ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <Icon size={20} />
                          </div>
                          {index < timelineSteps.length - 1 && (
                            <div className={`w-0.5 h-12 mt-2 ${step.completed ? "bg-accent" : "bg-muted"}`}></div>
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="font-semibold text-foreground">{step.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(step.time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* ETA Card */}
              <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg p-6 text-white space-y-3">
                <p className="text-sm font-medium opacity-90">Estimated Arrival</p>
                <p className="text-4xl font-bold">{etaMinutes} min</p>
                <p className="text-sm opacity-90">
                  Around {deliveryPartner.eta.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {/* Order Details */}
              <div className="bg-card rounded-2xl border border-border shadow-lg p-6 space-y-4">
                <h3 className="font-bold text-foreground">Order Details</h3>

                <div className="space-y-3 border-b border-border pb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.mealName} × {item.quantity}
                      </span>
                      <span className="font-semibold text-foreground">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">₹{order.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-foreground">₹{order.delivery}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="text-foreground">₹{order.tax}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 flex justify-between items-center">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-bold text-primary text-lg">₹{order.total}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-card rounded-2xl border border-border shadow-lg p-6 space-y-3">
                <h3 className="font-bold text-foreground">Payment Method</h3>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  {order.paymentMethod === "upi" && <Smartphone size={20} className="text-primary" />}
                  {order.paymentMethod === "card" && <CreditCard size={20} className="text-primary" />}
                  {order.paymentMethod === "cod" && <Banknote size={20} className="text-primary" />}
                  <div>
                    <p className="font-medium text-foreground capitalize">{order.paymentMethod}</p>
                    {order.paymentMethod === "cod" && <p className="text-xs text-muted-foreground">Pay on delivery</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

import { CreditCard, Banknote, Smartphone } from "lucide-react"
