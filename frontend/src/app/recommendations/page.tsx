"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Sparkles, History } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"

export default function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const { token } = useAuthStore()
  const router = useRouter()

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Please log in to view recommendations</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Sparkles className="h-8 w-8" />
        Personalized Recommendations
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-4 mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="preference">Based on Preferences</TabsTrigger>
          <TabsTrigger value="history">Order History</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <RecommendationsGrid type={null} />
        </TabsContent>

        <TabsContent value="trending">
          <RecommendationsGrid type="trending" />
        </TabsContent>

        <TabsContent value="preference">
          <RecommendationsGrid type="preference" />
        </TabsContent>

        <TabsContent value="history">
          <RecommendationsGrid type="history" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RecommendationsGrid({ type }: { type: string | null }) {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    loadRecommendations()
  }, [type])

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      const params: any = { limit: 20 }
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="bg-gray-200 h-40 rounded mb-3"></div>
            <div className="bg-gray-200 h-4 rounded mb-2"></div>
            <div className="bg-gray-200 h-3 rounded"></div>
          </Card>
        ))}
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600">No recommendations available at the moment.</p>
        <p className="text-sm text-gray-500 mt-2">
          Order more meals to get personalized recommendations!
        </p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {recommendations.map((rec) => (
        <Card
          key={rec.menu_item_id}
          className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push(`/restaurants/${rec.restaurant.slug}`)}
        >
          {rec.menu_item.image_url && (
            <div className="relative h-40 overflow-hidden">
              <img
                src={rec.menu_item.image_url}
                alt={rec.menu_item.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-4">
            <h3 className="font-semibold mb-1 line-clamp-2">
              {rec.menu_item.name}
            </h3>
            <p className="text-sm text-gray-600 mb-2">{rec.restaurant.name}</p>
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">
              {rec.menu_item.description}
            </p>
            
            {rec.reason && (
              <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mb-3">
                {rec.reason}
              </p>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-green-600">
                ₹{rec.menu_item.price}
              </span>
              <span className="text-xs text-gray-500">
                {Math.round(rec.score * 100)}% match
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
