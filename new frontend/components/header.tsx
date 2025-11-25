"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, X, MapPin, ShoppingCart, LogOut, User, Moon, Sun } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { useTheme } from "@/components/theme-provider"

interface HeaderProps {
  isLoggedIn?: boolean
  userName?: string
  cartCount?: number
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [location, setLocation] = useState<string>("Location")
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const { user, logout } = useAuth()
  const { items } = useCart()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()

  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }

    setIsLoadingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        // Reverse geocode to get address (using a free API)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          )
          const data = await response.json()

          // Get city or suburb
          const locationName = data.address.city || data.address.town || data.address.suburb || "Your Location"
          setLocation(locationName)
        } catch (error) {
          console.log("[v0] Error fetching location name:", error)
          setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`)
        } finally {
          setIsLoadingLocation(false)
        }
      },
      (error) => {
        console.log("[v0] Geolocation error:", error)
        setIsLoadingLocation(false)
        alert("Unable to retrieve your location. Please check your browser permissions.")
      },
    )
  }

  const handleLogout = () => {
    logout()
    router.push("/signin")
  }

  useEffect(() => {
    // Request location on component mount
    requestLocation()
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg md:text-xl">S</span>
            </div>
            <span className="hidden sm:inline font-bold text-lg md:text-xl text-foreground">SmartBite</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/discover" className="text-muted-foreground hover:text-foreground transition">
              Discover
            </Link>
            <Link href="/plans" className="text-muted-foreground hover:text-foreground transition">
              Plans
            </Link>
            {user && (
              <Link href="/orders" className="text-muted-foreground hover:text-foreground transition">
                Orders
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Location - Hidden on small screens */}
            <button
              onClick={requestLocation}
              disabled={isLoadingLocation}
              className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-muted transition text-sm text-muted-foreground disabled:opacity-50"
            >
              <MapPin size={18} />
              <span className="hidden md:inline">{isLoadingLocation ? "Loading..." : location}</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 md:p-3 hover:bg-muted rounded-lg transition"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Cart */}
            <Link href="/cart" className="p-2 md:p-3 hover:bg-muted rounded-lg transition relative">
              <ShoppingCart size={20} />
              {items.length > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">
                  {items.length}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-muted rounded-lg transition"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* User Menu or Sign In */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/profile"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium text-sm md:text-base flex items-center gap-2"
                >
                  <User size={16} />
                  {user.name}
                </Link>
                <button onClick={handleLogout} className="p-2 hover:bg-muted rounded-lg transition">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link
                href="/signin"
                className="hidden sm:block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium text-sm md:text-base"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 space-y-2 border-t border-border">
            <Link
              href="/discover"
              className="block px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition"
            >
              Discover
            </Link>
            <Link
              href="/plans"
              className="block px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition"
            >
              Plans
            </Link>
            <Link
              href="/orders"
              className="block px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition"
            >
              Orders
            </Link>
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full mx-4 mt-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition font-medium text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/signin"
                className="w-full mx-4 mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium text-sm block text-center"
              >
                Sign In
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
