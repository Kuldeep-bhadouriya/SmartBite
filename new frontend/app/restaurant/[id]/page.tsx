"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Star, Clock, MapPin, Minus, Plus, ShoppingCart, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  calories: number
  image: string
  protein: number
  carbs: number
  fats: number
}

const restaurantData: Record<string, any> = {
  "1": {
    name: "Taj North Indian",
    cuisine: "North Indian",
    rating: 4.7,
    reviews: 324,
    distance: 2,
    prepTime: 25,
    image: "🍖",
    address: "Sector 10, City Center",
    menu: [
      {
        id: "1-1",
        name: "Butter Chicken",
        description: "Creamy tomato base with tender chicken",
        price: 280,
        calories: 680,
        protein: 48,
        carbs: 18,
        fats: 22,
        image: "🥘",
      },
      {
        id: "1-2",
        name: "Paneer Tikka Masala",
        description: "Cottage cheese in aromatic gravy",
        price: 250,
        calories: 620,
        protein: 35,
        carbs: 15,
        fats: 25,
        image: "🧀",
      },
      {
        id: "1-3",
        name: "Dal Makhani",
        description: "Creamy lentils with butter and cream",
        price: 220,
        calories: 480,
        protein: 18,
        carbs: 45,
        fats: 15,
        image: "🥣",
      },
      {
        id: "1-4",
        name: "Garlic Naan",
        description: "Soft bread with garlic and butter",
        price: 80,
        calories: 320,
        protein: 8,
        carbs: 52,
        fats: 12,
        image: "🍞",
      },
    ],
  },
  "2": {
    name: "Pizza Paradise",
    cuisine: "Italian",
    rating: 4.5,
    reviews: 287,
    distance: 3,
    prepTime: 30,
    image: "🍕",
    address: "Sector 15, Market Area",
    menu: [
      {
        id: "2-1",
        name: "Margherita Pizza",
        description: "Fresh mozzarella, basil, tomato sauce",
        price: 320,
        calories: 650,
        protein: 25,
        carbs: 72,
        fats: 18,
        image: "🍕",
      },
      {
        id: "2-2",
        name: "Pepperoni Pizza",
        description: "Italian pepperoni with cheese",
        price: 380,
        calories: 720,
        protein: 30,
        carbs: 70,
        fats: 22,
        image: "🍕",
      },
      {
        id: "2-3",
        name: "Veggie Supreme",
        description: "Bell peppers, mushrooms, onions",
        price: 300,
        calories: 580,
        protein: 18,
        carbs: 68,
        fats: 16,
        image: "🍕",
      },
    ],
  },
  "3": {
    name: "Burger Barn",
    cuisine: "American",
    rating: 4.3,
    reviews: 156,
    distance: 1.5,
    prepTime: 20,
    image: "🍔",
    address: "Sector 8, Street 5",
    menu: [
      {
        id: "3-1",
        name: "Classic Burger",
        description: "Beef patty, lettuce, tomato, mayo",
        price: 180,
        calories: 520,
        protein: 28,
        carbs: 45,
        fats: 18,
        image: "🍔",
      },
      {
        id: "3-2",
        name: "Double Cheese Burger",
        description: "Double patty with cheddar cheese",
        price: 240,
        calories: 680,
        protein: 42,
        carbs: 48,
        fats: 28,
        image: "🍔",
      },
      {
        id: "3-3",
        name: "Fries",
        description: "Crispy golden fries",
        price: 100,
        calories: 365,
        protein: 4,
        carbs: 48,
        fats: 17,
        image: "🍟",
      },
    ],
  },
}

export default function RestaurantPage({ params }: { params: { id: string } }) {
  const [restaurant, setRestaurant] = useState<any>(null)
  const router = useRouter()
  const { user } = useAuth()
  const { items, addItem, removeItem, updateQuantity } = useCart()

  useEffect(() => {
    if (!user) {
      router.push("/signin")
      return
    }

    const restaurantInfo = restaurantData[params.id]
    if (!restaurantInfo) {
      router.push("/")
      return
    }
    setRestaurant(restaurantInfo)
  }, [params.id, router, user])

  if (!restaurant) return null

  const restaurantItems = items.filter((item) => item.restaurantId === params.id)
  const totalPrice = restaurantItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalCalories = restaurantItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      id: item.id,
      restaurantId: params.id,
      restaurantName: restaurant.name,
      mealName: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
    })
  }

  const handleCheckout = () => {
    if (restaurantItems.length === 0) return
    router.push("/cart")
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 py-8 md:py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Restaurant Header */}
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6 md:p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
              <div className="text-6xl">{restaurant.image}</div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">{restaurant.name}</h1>
                <p className="text-muted-foreground mt-1">{restaurant.cuisine}</p>

                <div className="flex flex-wrap gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star size={18} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-foreground">{restaurant.rating}</span>
                    <span className="text-muted-foreground">({restaurant.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin size={18} />
                    <span>{restaurant.distance} km</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock size={18} />
                    <span>{restaurant.prepTime} min</span>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm mt-4">{restaurant.address}</p>
              </div>
            </div>
          </div>

          {/* Menu & Cart Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Menu */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold text-foreground mb-6">Menu</h2>
              <div className="space-y-4">
                {restaurant.menu.map((item: MenuItem) => {
                  const cartItem = restaurantItems.find((c) => c.id === item.id)
                  return (
                    <div key={item.id} className="bg-card rounded-xl border border-border p-4 md:p-5 flex gap-4">
                      <div className="text-5xl flex-shrink-0">{item.image}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground text-lg">{item.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-primary text-lg">₹{item.price}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 flex-wrap">
                          <span>{item.calories} cal</span>
                          <span>•</span>
                          <span>{item.protein}g protein</span>
                          <span>•</span>
                          <span>{item.carbs}g carbs</span>
                        </div>

                        {cartItem ? (
                          <div className="flex items-center gap-2 bg-primary/10 rounded-lg p-2 w-fit">
                            <button
                              onClick={() => updateQuantity(item.id, cartItem.quantity - 1)}
                              className="p-1 hover:bg-primary/20 rounded transition"
                            >
                              <Minus size={16} className="text-primary" />
                            </button>
                            <span className="w-6 text-center font-semibold text-primary">{cartItem.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}
                              className="p-1 hover:bg-primary/20 rounded transition"
                            >
                              <Plus size={16} className="text-primary" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium text-sm flex items-center gap-2"
                          >
                            <Plus size={16} />
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Cart Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl border border-border shadow-lg p-6 sticky top-24 space-y-4">
                <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                  <ShoppingCart size={20} />
                  Your Cart
                </h3>

                {restaurantItems.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No items in cart. Add items from the menu!</p>
                ) : (
                  <>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {restaurantItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-start p-3 bg-muted rounded-lg">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-foreground">{item.mealName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × ₹{item.price}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-destructive hover:bg-destructive/10 p-1 rounded transition"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border pt-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-semibold text-foreground">₹{totalPrice}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery</span>
                        <span className="font-semibold text-foreground">₹40</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-semibold text-foreground">₹{Math.round(totalPrice * 0.1)}</span>
                      </div>

                      <div className="pt-3 border-t border-border flex justify-between">
                        <span className="font-bold text-foreground">Total</span>
                        <span className="font-bold text-primary text-lg">
                          ₹{totalPrice + 40 + Math.round(totalPrice * 0.1)}
                        </span>
                      </div>

                      <button
                        onClick={handleCheckout}
                        disabled={restaurantItems.length === 0}
                        className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold rounded-lg hover:from-primary/90 hover:to-primary/70 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Go to Cart
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
