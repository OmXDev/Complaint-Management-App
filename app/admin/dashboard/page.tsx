import ComplaintTable from "@/components/complaint-table"
import { Button } from "@/components/ui/button"
import { requireAuth } from "@/lib/auth"
import { getComplaintsService } from "@/lib/complaint-service"
import { logout } from "@/actions/auth"

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

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: {
    status?: string
    priority?: string
  }
}) {
  const { id: adminId, role } = await requireAuth(["admin"])

  const awaitedSearchParams = await searchParams
  const statusFilter = awaitedSearchParams?.status || "all"
  const priorityFilter = awaitedSearchParams?.priority || "all"

  let complaints: Complaint[] = []
  let error: string | null = null

  try {
    complaints = await getComplaintsService("admin", adminId, statusFilter, priorityFilter)
  } catch (err: any) {
    console.error("Error fetching admin complaints:", err)
    error = err.message || "Failed to load complaints."
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-2 sm:p-4 dark:bg-gray-950">
      <header className="flex w-full max-w-6xl items-center justify-between py-4 px-2 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
        <form action={logout}>
          <Button variant="outline" type="submit" size="sm" className="sm:size-default bg-transparent">
            Logout
          </Button>
        </form>
      </header>
      <main className="w-full max-w-6xl space-y-6 sm:space-y-8 py-4 sm:py-8 px-2 sm:px-0">
        <ComplaintTable
          complaints={complaints}
          error={error}
          initialStatusFilter={statusFilter}
          initialPriorityFilter={priorityFilter}
        />
      </main>
    </div>
  )
}
