"use client"

import { useState, useEffect } from "react"
import { Settings, Save, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth-store"

const DIETARY_TYPES = [
  { value: "veg", label: "Vegetarian" },
  { value: "non_veg", label: "Non-Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "jain", label: "Jain" },
  { value: "eggetarian", label: "Eggetarian" }
]

const SPICE_LEVELS = [
  { value: "none", label: "No Spice" },
  { value: "mild", label: "Mild" },
  { value: "medium", label: "Medium" },
  { value: "hot", label: "Hot" },
  { value: "extra_hot", label: "Extra Hot" }
]

const CUISINES = [
  "Italian", "Chinese", "Indian", "Mexican", "Thai", 
  "Japanese", "American", "Mediterranean", "Korean", "Vietnamese"
]

const COMMON_ALLERGENS = [
  "Peanuts", "Tree Nuts", "Milk", "Eggs", "Fish", 
  "Shellfish", "Soy", "Wheat", "Sesame"
]

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState({
    dietary_type: "veg",
    cuisine_preferences: [] as string[],
    spice_level: "medium",
    allergens: [] as string[],
    min_budget: null as number | null,
    max_budget: null as number | null,
    favorite_restaurants: [] as number[],
    disliked_items: [] as number[]
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const { token } = useAuthStore()

  useEffect(() => {
    if (token) {
      loadPreferences()
    }
  }, [token])

  const loadPreferences = async () => {
    try {
      const response = await api.get("/preferences/", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.id !== 0) {
        setPreferences(response.data)
      }
    } catch (error) {
      console.error("Error loading preferences:", error)
    }
  }

  const savePreferences = async () => {
    try {
      setLoading(true)
      setSaved(false)
      
      await api.put("/preferences/", preferences, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("Error saving preferences:", error)
      alert("Failed to save preferences")
    } finally {
      setLoading(false)
    }
  }

  const toggleCuisine = (cuisine: string) => {
    setPreferences(prev => ({
      ...prev,
      cuisine_preferences: prev.cuisine_preferences.includes(cuisine)
        ? prev.cuisine_preferences.filter(c => c !== cuisine)
        : [...prev.cuisine_preferences, cuisine]
    }))
  }

  const toggleAllergen = (allergen: string) => {
    setPreferences(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }))
  }

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Please log in to manage your preferences</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Food Preferences
          </h1>
          <p className="text-gray-600 mt-2">
            Help us personalize your meal recommendations
          </p>
        </div>
        <Button onClick={savePreferences} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Preferences"}
        </Button>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-6 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Preferences saved successfully!
        </div>
      )}

      {/* Dietary Type */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Dietary Preference</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {DIETARY_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setPreferences(prev => ({ ...prev, dietary_type: type.value }))}
              className={`p-3 border-2 rounded-lg text-center transition-all ${
                preferences.dietary_type === type.value
                  ? "border-green-500 bg-green-50 font-semibold"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Spice Level */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Spice Level</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {SPICE_LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => setPreferences(prev => ({ ...prev, spice_level: level.value }))}
              className={`p-3 border-2 rounded-lg text-center transition-all ${
                preferences.spice_level === level.value
                  ? "border-orange-500 bg-orange-50 font-semibold"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Cuisine Preferences */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Favorite Cuisines</h2>
        <p className="text-sm text-gray-600 mb-4">Select all that apply</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {CUISINES.map((cuisine) => (
            <button
              key={cuisine}
              onClick={() => toggleCuisine(cuisine)}
              className={`p-3 border-2 rounded-lg text-center transition-all ${
                preferences.cuisine_preferences.includes(cuisine)
                  ? "border-blue-500 bg-blue-50 font-semibold"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </Card>

      {/* Allergens */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Allergen Information</h2>
        <p className="text-sm text-gray-600 mb-4">Select allergens you want to avoid</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {COMMON_ALLERGENS.map((allergen) => (
            <button
              key={allergen}
              onClick={() => toggleAllergen(allergen)}
              className={`p-3 border-2 rounded-lg text-center transition-all ${
                preferences.allergens.includes(allergen)
                  ? "border-red-500 bg-red-50 font-semibold"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {allergen}
            </button>
          ))}
        </div>
      </Card>

      {/* Budget Range */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Budget Preferences</h2>
        <p className="text-sm text-gray-600 mb-4">Set your typical meal budget range</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="minBudget">Minimum Price (₹)</Label>
            <Input
              id="minBudget"
              type="number"
              value={preferences.min_budget || ""}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                min_budget: e.target.value ? parseInt(e.target.value) : null
              }))}
              placeholder="50"
            />
          </div>
          <div>
            <Label htmlFor="maxBudget">Maximum Price (₹)</Label>
            <Input
              id="maxBudget"
              type="number"
              value={preferences.max_budget || ""}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                max_budget: e.target.value ? parseInt(e.target.value) : null
              }))}
              placeholder="500"
            />
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">How we use your preferences</h3>
            <p className="text-sm text-blue-800">
              Your preferences help us provide personalized meal recommendations, 
              filter menu items that match your dietary needs, and suggest meal plans 
              tailored to your taste and budget. You can update these anytime.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
