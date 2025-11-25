"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, CheckCircle, XIcon, MapPin, FileText } from "lucide-react"

interface OrderItem {
  id: number
  mealName: string
  quantity: number
  price: number
}

interface Order {
  id: string
  restaurantName: string
  items: OrderItem[]
  total: number
  subtotal: number
  tax: number
  delivery: number
  status: "pending" | "confirmed" | "delivered" | "cancelled"
  createdAt: string
  paymentMethod: string
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (!stored) {
      router.push("/signin")
      return
    }
    setUser(JSON.parse(stored))

    const savedOrders = JSON.parse(localStorage.getItem("nexmeal_orders") || "[]")
    setOrders(savedOrders)
  }, [router])

  const currentOrders = orders.filter((o) => o.status === "pending" || o.status === "confirmed")
  const pastOrders = orders.filter((o) => o.status === "delivered" || o.status === "cancelled")

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="text-accent" size={20} />
      case "pending":
      case "confirmed":
        return <Clock className="text-primary animate-spin" size={20} />
      case "cancelled":
        return <XIcon className="text-destructive" size={20} />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-accent/10 text-accent"
      case "pending":
      case "confirmed":
        return "bg-primary/10 text-primary"
      case "cancelled":
        return "bg-destructive/10 text-destructive"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const OrderCard = ({ order, isCurrent }: { order: Order; isCurrent: boolean }) => (
    <div className="bg-card rounded-xl border border-border p-5 md:p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-lg">{order.restaurantName}</h3>
          <p className="text-sm text-muted-foreground">Order ID: {order.id}</p>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full font-medium text-sm whitespace-nowrap ${getStatusColor(order.status)}`}
        >
          {getStatusIcon(order.status)}
          <span className="capitalize">{order.status}</span>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-border">
        <h4 className="font-semibold text-foreground text-sm">Items:</h4>
        <div className="space-y-1">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm text-muted-foreground">
              <span>
                {item.mealName} × {item.quantity}
              </span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString()} at{" "}
              {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <p className="font-bold text-foreground text-lg">₹{order.total}</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {isCurrent && (
            <>
              <button
                onClick={() => router.push(`/tracking/${order.id}`)}
                className="flex-1 min-w-fit py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium text-sm flex items-center justify-center gap-2"
              >
                <MapPin size={16} />
                <span>Live Tracking</span>
              </button>
              <button
                onClick={() => router.push(`/order-summary/${order.id}`)}
                className="flex-1 min-w-fit py-2 px-4 border border-primary text-primary rounded-lg hover:bg-primary/5 transition font-medium text-sm flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                <span>Order Summary</span>
              </button>
            </>
          )}
          {!isCurrent && (
            <button
              onClick={() => router.push(`/order-summary/${order.id}`)}
              className="w-full py-2 px-4 border border-border text-foreground rounded-lg hover:bg-muted transition font-medium text-sm flex items-center justify-center gap-2"
            >
              <FileText size={16} />
              <span>View Bill</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">My Orders</h1>
            <p className="text-muted-foreground">Track your current and past orders</p>
          </div>

          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="current" className="flex items-center gap-2">
                <Clock size={18} />
                <span>Current Orders</span>
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-2">
                <CheckCircle size={18} />
                <span>Past Orders</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-4">
              {currentOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Clock size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground text-lg">No active orders</p>
                  <p className="text-sm text-muted-foreground mt-1">Place an order to see it here</p>
                </div>
              ) : (
                currentOrders.map((order) => <OrderCard key={order.id} order={order} isCurrent={true} />)
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastOrders.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground text-lg">No past orders</p>
                  <p className="text-sm text-muted-foreground mt-1">Your completed orders will appear here</p>
                </div>
              ) : (
                pastOrders.map((order) => <OrderCard key={order.id} order={order} isCurrent={false} />)
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </main>
  )
}
