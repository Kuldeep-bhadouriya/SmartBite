"use client"

import { useState, useEffect } from "react"
import { Sparkles, TrendingUp, Clock, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"

interface Recommendation {
  id: number
  menu_item_id: number
  score: number
  reason: string
  recommendation_type: string
  menu_item: {
    id: number
    name: string
    description: string
    price: number
    image_url?: string
  }
  restaurant: {
    id: number
    name: string
    slug: string
  }
}

interface RecommendationsSectionProps {
  title?: string
  type?: string
  limit?: number
  showReason?: boolean
}

export default function RecommendationsSection({
  title = "Recommended For You",
  type,
  limit = 10,
  showReason = true
}: RecommendationsSectionProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (token) {
      loadRecommendations()
    }
  }, [token, type])

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      const params: any = { limit }
      if (type) params.recommendation_type = type

      const response = await api.get("/recommendations/", {
        params,
        headers: { Authorization: `Bearer ${token}` }
      })
      setRecommendations(response.data)
    } catch (error) {
      console.error("Error loading recommendations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleItemClick = async (rec: Recommendation) => {
    // Track interaction
    try {
      await api.post(
        "/recommendations/track-interaction",
        {
          menu_item_id: rec.menu_item_id,
          interaction_type: "view"
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
    } catch (error) {
      console.error("Error tracking interaction:", error)
    }

    // Navigate to restaurant page
    router.push(`/restaurants/${rec.restaurant.slug}`)
  }

  const getIcon = () => {
    switch (type) {
      case "trending":
        return <TrendingUp className="h-5 w-5" />
      case "history":
        return <Clock className="h-5 w-5" />
      default:
        return <Sparkles className="h-5 w-5" />
    }
  }

  if (!token) return null

  if (loading) {
    return (
      <div className="my-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          {getIcon()}
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="bg-gray-200 h-32 rounded mb-3"></div>
              <div className="bg-gray-200 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 h-3 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) return null

  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        {getIcon()}
        {title}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {recommendations.map((rec) => (
          <Card
            key={rec.menu_item_id}
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleItemClick(rec)}
          >
            {rec.menu_item.image_url && (
              <div className="relative h-40 overflow-hidden">
                <img
                  src={rec.menu_item.image_url}
                  alt={rec.menu_item.name}
                  className="w-full h-full object-cover"
                />
                {rec.recommendation_type === "trending" && (
                  <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Trending
                  </div>
                )}
              </div>
            )}
            
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                {rec.menu_item.name}
              </h3>
              <p className="text-xs text-gray-600 mb-2">{rec.restaurant.name}</p>
              
              {showReason && rec.reason && (
                <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mb-2">
                  {rec.reason}
                </p>
              )}
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-lg font-bold text-green-600">
                  ₹{rec.menu_item.price}
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
