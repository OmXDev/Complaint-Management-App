

import { logout } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { requireAuth } from "@/lib/auth"
import { getComplaintsService } from "@/lib/complaint-service"
import UserDashboardClient from "@/components/user-dashboard-client"

interface Complaint {
  _id: string
  title: string
  description: string
  category: "Product" | "Service" | "Support"
  priority: "Low" | "Medium" | "High"
  status: "Pending" | "In Progress" | "Resolved"
  userId: string
  createdAt: string
}

export default async function UserDashboardPage() {
  const { id: userId, role } = await requireAuth(["user"])

  let complaints: Complaint[] = []
  let error: string | null = null

  try {
    complaints = await getComplaintsService("user", userId, "all", "all")
  } catch (err: any) {
    console.error("Error fetching user complaints:", err)
    error = err.message || "Failed to load complaints."
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-2 sm:p-4 dark:bg-gray-950">
      <header className="flex w-full max-w-4xl items-center justify-between py-4 px-2 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold">User Dashboard</h1>
        <form action={logout}>
          <Button variant="outline" type="submit" size="sm" className="sm:size-default bg-transparent">
            Logout
          </Button>
        </form>
      </header>
      <main className="w-full max-w-4xl space-y-6 sm:space-y-8 py-4 sm:py-8 px-2 sm:px-0">
        <UserDashboardClient initialComplaints={complaints} initialError={error} />
      </main>
    </div>
  )
}
