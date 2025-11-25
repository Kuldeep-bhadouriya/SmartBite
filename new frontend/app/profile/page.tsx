"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Edit2, Save, X, MailIcon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function Profile() {
  const router = useRouter()
  const { user, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState(user)
  const [loading, setLoading] = useState(false)

  if (!user) {
    router.push("/signin")
    return null
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      if (formData) {
        updateProfile(formData)
        setEditing(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    if (formData) {
      setFormData({ ...formData, [field]: value } as any)
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 py-8 md:py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
                <p className="text-muted-foreground mt-1">Manage your account details</p>
              </div>
              <button
                onClick={() => (editing ? handleSave() : setEditing(true))}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-50 whitespace-nowrap"
              >
                {editing ? (
                  <>
                    <Save size={18} />
                    {loading ? "Saving..." : "Save Changes"}
                  </>
                ) : (
                  <>
                    <Edit2 size={18} />
                    Edit Profile
                  </>
                )}
              </button>
            </div>

            <div className="space-y-6">
              {/* Avatar & Name */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-border">
                <img
                  src={user.image || "/placeholder.svg"}
                  alt={user.name}
                  className="w-20 h-20 rounded-full border-4 border-primary flex-shrink-0"
                />
                <div className="flex-1 text-center sm:text-left">
                  {editing ? (
                    <input
                      type="text"
                      value={formData?.name || ""}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="text-2xl font-bold w-full px-3 py-2 rounded-lg border border-border bg-muted"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                  )}
                  <p className="text-muted-foreground text-sm">Premium Member</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground text-lg">Contact Information</h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MailIcon size={18} />
                    Email
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      value={formData?.email || ""}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-muted text-foreground"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-muted rounded-lg text-foreground">{user.email}</p>
                  )}
                </div>
              </div>

              {/* Preferences */}
              <div className="pt-6 border-t border-border space-y-4">
                <h3 className="font-semibold text-foreground text-lg">Preferences</h3>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-primary" />
                    <span className="text-foreground">Email notifications</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-primary" />
                    <span className="text-foreground">SMS notifications</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-primary" />
                    <span className="text-foreground">Push notifications</span>
                  </label>
                </div>
              </div>

              {editing && (
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
                  <button
                    onClick={() => {
                      setEditing(false)
                      setFormData(user)
                    }}
                    className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-muted transition font-medium text-foreground flex items-center justify-center gap-2"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg hover:from-primary/90 hover:to-primary/70 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
