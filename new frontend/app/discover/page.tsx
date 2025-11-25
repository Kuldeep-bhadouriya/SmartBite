"use client"

import { useState } from "react"
import { Star, Clock, MapPin, Search } from "lucide-react"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"

const restaurants = [
  {
    id: 1,
    name: "Taj North Indian",
    cuisine: "North Indian",
    rating: 4.7,
    reviews: 324,
    distance: 2,
    prepTime: 25,
    image: "🍖",
    veg: true,
    nonVeg: true,
    slots: [
      { time: "12:00-1:00 PM", price: "Base", status: "available" },
      { time: "1:00-2:00 PM", price: "Base", status: "available" },
      { time: "5:00-6:00 PM", price: "+10%", status: "premium" },
    ],
  },
  {
    id: 2,
    name: "Pizza Paradise",
    cuisine: "Italian",
    rating: 4.5,
    reviews: 287,
    distance: 3,
    prepTime: 30,
    image: "🍕",
    veg: true,
    nonVeg: true,
    slots: [
      { time: "12:30-1:30 PM", price: "Base", status: "available" },
      { time: "6:00-7:00 PM", price: "Base", status: "available" },
    ],
  },
  {
    id: 3,
    name: "Vegan Heaven",
    cuisine: "Vegan",
    rating: 4.8,
    reviews: 412,
    distance: 1.5,
    prepTime: 20,
    image: "🥗",
    veg: true,
    nonVeg: false,
    slots: [
      { time: "12:00-1:00 PM", price: "-15%", status: "discount" },
      { time: "5:00-6:00 PM", price: "Base", status: "available" },
    ],
  },
  {
    id: 4,
    name: "Sushi Station",
    cuisine: "Japanese",
    rating: 4.6,
    reviews: 198,
    distance: 2.5,
    prepTime: 28,
    image: "🍣",
    veg: true,
    nonVeg: true,
    slots: [
      { time: "12:00-1:00 PM", price: "Base", status: "available" },
      { time: "6:30-7:30 PM", price: "Base", status: "available" },
    ],
  },
  {
    id: 5,
    name: "Burger Hub",
    cuisine: "Fast Food",
    rating: 4.3,
    reviews: 567,
    distance: 1,
    prepTime: 15,
    image: "🍔",
    veg: true,
    nonVeg: true,
    slots: [
      { time: "11:30 AM-12:30 PM", price: "-15%", status: "discount" },
      { time: "5:00-6:00 PM", price: "Base", status: "available" },
    ],
  },
  {
    id: 6,
    name: "Thai Delights",
    cuisine: "Thai",
    rating: 4.7,
    reviews: 342,
    distance: 2,
    prepTime: 22,
    image: "🌶️",
    veg: true,
    nonVeg: true,
    slots: [
      { time: "12:00-1:00 PM", price: "Base", status: "available" },
      { time: "5:00-6:00 PM", price: "+10%", status: "premium" },
    ],
  },
]

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [selectedFood, setSelectedFood] = useState<string | null>(null)

  const filtered = restaurants.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRating = !selectedRating || r.rating >= selectedRating
    const matchesFood = !selectedFood || (selectedFood === "veg" && r.veg) || (selectedFood === "nonveg" && r.nonVeg)

    return matchesSearch && matchesRating && matchesFood
  })

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Discover Restaurants</h1>
            <p className="text-muted-foreground">Browse and order from our partner restaurants</p>
          </div>

          {/* Search & Filters */}
          <div className="space-y-4 md:space-y-6 mb-8">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="text"
                placeholder="Search restaurants or cuisines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Filter Pills */}
            <div className="space-y-4">
              {/* Rating Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedRating(null)}
                  className={`px-4 py-2 rounded-full font-medium text-sm transition ${
                    selectedRating === null
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground border border-border hover:border-primary"
                  }`}
                >
                  All Ratings
                </button>
                {[4.5, 4.6, 4.7, 4.8].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setSelectedRating(rating)}
                    className={`px-4 py-2 rounded-full font-medium text-sm transition flex items-center gap-1 ${
                      selectedRating === rating
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-foreground border border-border hover:border-primary"
                    }`}
                  >
                    <Star size={16} className="fill-current" />
                    {rating}+
                  </button>
                ))}
              </div>

              {/* Food Type Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedFood(null)}
                  className={`px-4 py-2 rounded-full font-medium text-sm transition ${
                    selectedFood === null
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground border border-border hover:border-primary"
                  }`}
                >
                  All Types
                </button>
                <button
                  onClick={() => setSelectedFood("veg")}
                  className={`px-4 py-2 rounded-full font-medium text-sm transition ${
                    selectedFood === "veg"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground border border-border hover:border-primary"
                  }`}
                >
                  🥗 Vegetarian
                </button>
                <button
                  onClick={() => setSelectedFood("nonveg")}
                  className={`px-4 py-2 rounded-full font-medium text-sm transition ${
                    selectedFood === "nonveg"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground border border-border hover:border-primary"
                  }`}
                >
                  🍖 Non-Veg
                </button>
              </div>
            </div>
          </div>

          {/* Restaurant Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {filtered.map((restaurant) => (
              <div
                key={restaurant.id}
                className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition group cursor-pointer border border-border hover:border-primary"
              >
                {/* Image Area */}
                <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-6xl md:text-7xl group-hover:scale-105 transition">
                  {restaurant.image}
                </div>

                {/* Content */}
                <div className="p-4 md:p-5 space-y-4">
                  {/* Header */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg md:text-xl text-foreground line-clamp-1">{restaurant.name}</h3>
                    <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star size={16} className="fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-foreground">{restaurant.rating}</span>
                        <span className="text-xs">({restaurant.reviews})</span>
                      </div>
                    </div>
                  </div>

                  {/* Location & Time */}
                  <div className="flex items-center gap-4 text-xs md:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>{restaurant.distance} km</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{restaurant.prepTime} min</span>
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground">Available Slots:</p>
                    <div className="space-y-1">
                      {restaurant.slots.slice(0, 2).map((slot, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{slot.time}</span>
                          <span
                            className={`font-semibold px-2 py-1 rounded ${
                              slot.status === "premium"
                                ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                                : slot.status === "discount"
                                  ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300"
                                  : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                            }`}
                          >
                            {slot.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link
                    href={`/restaurant/${restaurant.id}`}
                    className="w-full block py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold rounded-lg hover:from-primary/90 hover:to-primary/70 transition mt-4 text-center"
                  >
                    View Menu
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No restaurants found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
