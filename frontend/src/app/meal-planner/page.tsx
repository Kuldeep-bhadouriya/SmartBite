"use client"

import { useState, useEffect } from "react"
import { Calendar, Plus, Trash2, Clock, DollarSign, Save, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  image_url?: string
  restaurant_id: number
  is_available: boolean
}

interface Restaurant {
  id: number
  name: string
  slug: string
}

interface PlannedMeal {
  id?: number
  menu_item_id: number
  restaurant_id: number
  day_of_week: number
  meal_type: string
  time_slot_id?: number
  notes?: string
  quantity: number
  menu_item?: MenuItem
  restaurant?: Restaurant
}

interface MealPlan {
  id?: number
  name: string
  description?: string
  meals: PlannedMeal[]
  is_active?: boolean
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"]

export default function MealPlannerPage() {
  const [mealPlan, setMealPlan] = useState<MealPlan>({
    name: "My Weekly Plan",
    description: "",
    meals: []
  })
  const [savedPlans, setSavedPlans] = useState<any[]>([])
  const [showAddMealDialog, setShowAddMealDialog] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; mealType: string } | null>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [draggedMeal, setDraggedMeal] = useState<PlannedMeal | null>(null)
  
  const { token } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (token) {
      loadSavedPlans()
    }
  }, [token])

  const loadSavedPlans = async () => {
    try {
      const response = await api.get("/meal-plans/", {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSavedPlans(response.data)
    } catch (error) {
      console.error("Error loading meal plans:", error)
    }
  }

  const loadRecommendations = async (day: number, mealType: string) => {
    try {
      setLoading(true)
      const response = await api.get("/recommendations/for-meal-planner", {
        params: { day_of_week: day, meal_type: mealType, limit: 10 },
        headers: { Authorization: `Bearer ${token}` }
      })
      setRecommendations(response.data)
    } catch (error) {
      console.error("Error loading recommendations:", error)
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddMeal = (day: number, mealType: string) => {
    setSelectedSlot({ day, mealType })
    loadRecommendations(day, mealType)
    setShowAddMealDialog(true)
  }

  const addMealToSlot = (menuItem: any) => {
    if (!selectedSlot) return

    const newMeal: PlannedMeal = {
      menu_item_id: menuItem.menu_item.id,
      restaurant_id: menuItem.restaurant.id,
      day_of_week: selectedSlot.day,
      meal_type: selectedSlot.mealType,
      quantity: 1,
      menu_item: menuItem.menu_item,
      restaurant: menuItem.restaurant
    }

    setMealPlan(prev => ({
      ...prev,
      meals: [...prev.meals, newMeal]
    }))

    setShowAddMealDialog(false)
  }

  const removeMeal = (day: number, mealType: string, index: number) => {
    setMealPlan(prev => ({
      ...prev,
      meals: prev.meals.filter((meal, i) => 
        !(meal.day_of_week === day && meal.meal_type === mealType && i === index)
      )
    }))
  }

  const saveMealPlan = async () => {
    try {
      setLoading(true)
      const response = await api.post("/meal-plans/", mealPlan, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert("Meal plan saved successfully!")
      loadSavedPlans()
    } catch (error) {
      console.error("Error saving meal plan:", error)
      alert("Failed to save meal plan")
    } finally {
      setLoading(false)
    }
  }

  const loadMealPlan = async (planId: number) => {
    try {
      const response = await api.get(`/meal-plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMealPlan(response.data)
    } catch (error) {
      console.error("Error loading meal plan:", error)
    }
  }

  const orderWeeklyPlan = async () => {
    if (!mealPlan.id) {
      alert("Please save the meal plan first")
      return
    }

    const startDate = new Date()
    const nextMonday = new Date(startDate)
    nextMonday.setDate(startDate.getDate() + (1 + 7 - startDate.getDay()) % 7)

    try {
      setLoading(true)
      await api.post(`/meal-plans/${mealPlan.id}/order`, {
        meal_plan_id: mealPlan.id,
        start_date: nextMonday.toISOString().split("T")[0],
        delivery_address_id: 1 // Would need to select from user's addresses
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert("Weekly orders created successfully!")
      router.push("/orders")
    } catch (error) {
      console.error("Error ordering weekly plan:", error)
      alert("Failed to create orders")
    } finally {
      setLoading(false)
    }
  }

  const getMealsForSlot = (day: number, mealType: string) => {
    return mealPlan.meals.filter(
      meal => meal.day_of_week === day && meal.meal_type === mealType
    )
  }

  const calculateWeeklyTotal = () => {
    return mealPlan.meals.reduce((total, meal) => {
      return total + (meal.menu_item?.price || 0) * meal.quantity
    }, 0)
  }

  // Drag and drop handlers
  const handleDragStart = (meal: PlannedMeal) => {
    setDraggedMeal(meal)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (day: number, mealType: string) => {
    if (!draggedMeal) return

    setMealPlan(prev => ({
      ...prev,
      meals: prev.meals.map(meal =>
        meal === draggedMeal
          ? { ...meal, day_of_week: day, meal_type: mealType }
          : meal
      )
    }))

    setDraggedMeal(null)
  }

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Please log in to use the meal planner</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Weekly Meal Planner
          </h1>
          <p className="text-gray-600 mt-2">Plan your meals for the week ahead</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={saveMealPlan} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Plan
          </Button>
          <Button onClick={orderWeeklyPlan} disabled={loading || !mealPlan.id} variant="default">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Order This Week
          </Button>
        </div>
      </div>

      {/* Meal Plan Name */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="planName">Plan Name</Label>
            <Input
              id="planName"
              value={mealPlan.name}
              onChange={(e) => setMealPlan(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Weekly Plan"
            />
          </div>
          <div>
            <Label htmlFor="planDescription">Description (Optional)</Label>
            <Input
              id="planDescription"
              value={mealPlan.description || ""}
              onChange={(e) => setMealPlan(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add a description"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="font-semibold">Weekly Total: ₹{calculateWeeklyTotal().toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{mealPlan.meals.length} meals planned</span>
          </div>
        </div>
      </Card>

      {/* Weekly Calendar Grid */}
      <div className="grid gap-4">
        {DAYS.map((day, dayIndex) => (
          <Card key={dayIndex} className="p-4">
            <h3 className="font-semibold text-lg mb-3">{day}</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {MEAL_TYPES.map((mealType) => (
                <div
                  key={mealType}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-3 min-h-[100px]"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(dayIndex, mealType)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium capitalize">{mealType}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddMeal(dayIndex, mealType)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {getMealsForSlot(dayIndex, mealType).map((meal, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={() => handleDragStart(meal)}
                      className="bg-white border rounded p-2 mb-2 cursor-move hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{meal.menu_item?.name}</p>
                          <p className="text-xs text-gray-600">{meal.restaurant?.name}</p>
                          <p className="text-sm font-semibold text-green-600">
                            ₹{meal.menu_item?.price}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeMeal(dayIndex, mealType, index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Saved Plans Sidebar */}
      {savedPlans.length > 0 && (
        <Card className="p-4 mt-6">
          <h3 className="font-semibold text-lg mb-3">Your Saved Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {savedPlans.map((plan) => (
              <div
                key={plan.id}
                className="border rounded p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => loadMealPlan(plan.id)}
              >
                <p className="font-medium">{plan.name}</p>
                <p className="text-sm text-gray-600">{plan.meal_count} meals</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Meal Dialog */}
      <Dialog open={showAddMealDialog} onOpenChange={setShowAddMealDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Meal - {selectedSlot && DAYS[selectedSlot.day]} {selectedSlot?.mealType}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {loading ? (
              <p>Loading recommendations...</p>
            ) : recommendations.length > 0 ? (
              recommendations.map((rec) => (
                <div
                  key={rec.menu_item_id}
                  className="border rounded p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => addMealToSlot(rec)}
                >
                  <div className="flex gap-3">
                    {rec.menu_item.image_url && (
                      <img
                        src={rec.menu_item.image_url}
                        alt={rec.menu_item.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium">{rec.menu_item.name}</h4>
                      <p className="text-sm text-gray-600">{rec.restaurant.name}</p>
                      <p className="text-sm text-gray-500">{rec.menu_item.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-lg font-semibold text-green-600">
                          ₹{rec.menu_item.price}
                        </p>
                        {rec.reason && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {rec.reason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No recommendations available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
