"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, Calendar, DollarSign, Sparkles, X } from "lucide-react"

interface Meal {
  id: string
  mealName: string
  restaurant: string
  price: number
  timeSlot: "breakfast" | "lunch" | "dinner"
}

type DayPlan = {
  breakfast: Meal | null
  lunch: Meal | null
  dinner: Meal | null
}

type WeekPlan = {
  [key: string]: DayPlan
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const TIME_SLOTS = ["breakfast", "lunch", "dinner"] as const

const SUGGESTED_MEALS = [
  { mealName: "Masala Dosa", restaurant: "South Indian Corner", price: 120, timeSlot: "breakfast" },
  { mealName: "Paneer Butter Masala", restaurant: "Punjab Kitchen", price: 280, timeSlot: "lunch" },
  { mealName: "Grilled Chicken", restaurant: "Protein Hub", price: 350, timeSlot: "dinner" },
  { mealName: "Idli Sambar", restaurant: "South Indian Corner", price: 100, timeSlot: "breakfast" },
  { mealName: "Biryani", restaurant: "Hyderabadi Delight", price: 320, timeSlot: "lunch" },
  { mealName: "Caesar Salad", restaurant: "Green Bowl", price: 220, timeSlot: "dinner" },
]

export default function Plans() {
  const [user, setUser] = useState<any>(null)
  const [weekPlan, setWeekPlan] = useState<WeekPlan>({})
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<"breakfast" | "lunch" | "dinner" | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (!stored) {
      router.push("/signin")
      return
    }
    setUser(JSON.parse(stored))

    const savedPlan = JSON.parse(localStorage.getItem("nexmeal_weekplan") || "{}")
    const initialPlan: WeekPlan = {}
    DAYS.forEach((day) => {
      initialPlan[day] = savedPlan[day] || { breakfast: null, lunch: null, dinner: null }
    })
    setWeekPlan(initialPlan)
  }, [router])

  const savePlan = (plan: WeekPlan) => {
    setWeekPlan(plan)
    localStorage.setItem("nexmeal_weekplan", JSON.stringify(plan))
  }

  const addMeal = (meal: (typeof SUGGESTED_MEALS)[0]) => {
    if (!selectedDay || !selectedSlot) return

    const newMeal: Meal = {
      id: `${selectedDay}-${selectedSlot}-${Date.now()}`,
      ...meal,
      timeSlot: selectedSlot,
    }

    const newPlan = {
      ...weekPlan,
      [selectedDay]: {
        ...weekPlan[selectedDay],
        [selectedSlot]: newMeal,
      },
    }

    savePlan(newPlan)
    setIsDialogOpen(false)
  }

  const removeMeal = (day: string, slot: "breakfast" | "lunch" | "dinner") => {
    const newPlan = {
      ...weekPlan,
      [day]: {
        ...weekPlan[day],
        [slot]: null,
      },
    }
    savePlan(newPlan)
  }

  const clearWeek = () => {
    const emptyPlan: WeekPlan = {}
    DAYS.forEach((day) => {
      emptyPlan[day] = { breakfast: null, lunch: null, dinner: null }
    })
    savePlan(emptyPlan)
  }

  const autoFillWeek = () => {
    const newPlan: WeekPlan = {}
    DAYS.forEach((day, dayIndex) => {
      newPlan[day] = {
        breakfast: {
          id: `${day}-breakfast-${Date.now()}`,
          ...SUGGESTED_MEALS[dayIndex % 2 === 0 ? 0 : 3],
          timeSlot: "breakfast",
        },
        lunch: {
          id: `${day}-lunch-${Date.now()}`,
          ...SUGGESTED_MEALS[dayIndex % 2 === 0 ? 1 : 4],
          timeSlot: "lunch",
        },
        dinner: {
          id: `${day}-dinner-${Date.now()}`,
          ...SUGGESTED_MEALS[dayIndex % 2 === 0 ? 2 : 5],
          timeSlot: "dinner",
        },
      }
    })
    savePlan(newPlan)
  }

  const calculateTotal = () => {
    let total = 0
    let count = 0
    Object.values(weekPlan).forEach((day) => {
      TIME_SLOTS.forEach((slot) => {
        const meal = day[slot]
        if (meal) {
          total += meal.price
          count++
        }
      })
    })
    return { total, count }
  }

  const { total, count } = calculateTotal()

  const openAddDialog = (day: string, slot: "breakfast" | "lunch" | "dinner") => {
    setSelectedDay(day)
    setSelectedSlot(slot)
    setIsDialogOpen(true)
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-balance">Weekly Meal Planner</h1>
            <p className="text-muted-foreground text-pretty">
              Plan your meals for the week and enjoy hassle-free dining
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Week Summary */}
              <Card className="p-5 space-y-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Calendar size={20} className="text-primary" />
                  Week Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Meals</span>
                    <span className="font-semibold text-foreground">{count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Cost</span>
                    <span className="font-semibold text-foreground">₹{total}</span>
                  </div>
                </div>
              </Card>

              {/* Suggested Meals */}
              <Card className="p-5 space-y-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Sparkles size={20} className="text-accent" />
                  Suggested Meals
                </h3>
                <div className="space-y-2">
                  {SUGGESTED_MEALS.slice(0, 3).map((meal, idx) => (
                    <div key={idx} className="text-sm p-3 bg-muted rounded-lg">
                      <p className="font-medium text-foreground">{meal.mealName}</p>
                      <p className="text-xs text-muted-foreground">{meal.restaurant}</p>
                      <p className="text-xs text-accent mt-1">₹{meal.price}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Actions */}
              <Button onClick={autoFillWeek} className="w-full bg-transparent" variant="outline">
                <Sparkles size={16} className="mr-2" />
                Auto-Fill Week
              </Button>
              <Button onClick={clearWeek} className="w-full bg-transparent" variant="outline">
                <Trash2 size={16} className="mr-2" />
                Clear Week
              </Button>
            </div>

            {/* Week Grid */}
            <div className="lg:col-span-3 space-y-4">
              {DAYS.map((day) => (
                <Card key={day} className="p-4 md:p-5">
                  <h3 className="font-bold text-foreground mb-4">{day}</h3>
                  <div className="grid md:grid-cols-3 gap-3">
                    {TIME_SLOTS.map((slot) => {
                      const meal = weekPlan[day]?.[slot]
                      return (
                        <div key={slot} className="relative">
                          {meal ? (
                            <div className="border border-border rounded-lg p-4 bg-card hover:border-primary transition">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-medium text-accent capitalize">{slot}</span>
                                <button
                                  onClick={() => removeMeal(day, slot)}
                                  className="text-muted-foreground hover:text-destructive transition"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                              <h4 className="font-semibold text-foreground text-sm mb-1">{meal.mealName}</h4>
                              <p className="text-xs text-muted-foreground mb-2">{meal.restaurant}</p>
                              <p className="text-sm font-bold text-primary">₹{meal.price}</p>
                            </div>
                          ) : (
                            <button
                              onClick={() => openAddDialog(day, slot)}
                              className="w-full border-2 border-dashed border-border rounded-lg p-4 hover:border-primary hover:bg-muted/50 transition flex flex-col items-center justify-center gap-2 min-h-[140px]"
                            >
                              <Plus size={24} className="text-muted-foreground" />
                              <span className="text-xs text-muted-foreground capitalize">{slot}</span>
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="sticky bottom-0 bg-card border-t border-border shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Weekly Total</p>
              <p className="text-2xl font-bold text-foreground">₹{total}</p>
            </div>
            <div className="h-10 w-px bg-border hidden sm:block" />
            <div className="hidden sm:block">
              <p className="text-sm text-muted-foreground">Total Meals</p>
              <p className="text-lg font-semibold text-foreground">{count}</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={() => router.push("/")}>
              Save Draft
            </Button>
            <Button onClick={() => alert("Plan confirmed!")} disabled={count === 0}>
              <DollarSign size={16} className="mr-2" />
              Confirm Weekly Plan
            </Button>
            <Button variant="secondary" onClick={() => alert("Converting to subscription...")} disabled={count === 0}>
              Convert to Subscription
            </Button>
          </div>
        </div>
      </div>

      {/* Add Meal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add {selectedSlot} for {selectedDay}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {SUGGESTED_MEALS.filter((meal) => meal.timeSlot === selectedSlot).map((meal, idx) => (
              <button
                key={idx}
                onClick={() => addMeal(meal)}
                className="w-full text-left p-4 border border-border rounded-lg hover:border-primary hover:bg-muted/50 transition"
              >
                <h4 className="font-semibold text-foreground">{meal.mealName}</h4>
                <p className="text-sm text-muted-foreground">{meal.restaurant}</p>
                <p className="text-sm font-bold text-primary mt-1">₹{meal.price}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </main>
  )
}
