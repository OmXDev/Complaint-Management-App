import Link from "next/link"
import { Button } from "@/components/ui/button"
import { isAuthenticated } from "@/lib/auth" // Import isAuthenticated
import { redirect } from "next/navigation" // Import redirect

export default async function LandingPage() {
  // Check if user is already authenticated
  const { id, role } = await isAuthenticated()
  if (id && role) {
    console.log(`LandingPage: User already authenticated as ${role}. Redirecting to dashboard.`)
    redirect(role === "admin" ? "/admin/dashboard" : "/user/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 py-12 dark:bg-gray-950">
      <div className="mx-auto w-full max-w-md space-y-8 rounded-lg bg-white p-8 text-center shadow-lg dark:bg-gray-900">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-5xl">
          Complaint Management System
        </h1>
        <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-400">
          Your platform for submitting and managing complaints efficiently.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/auth-selection?type=login">Login</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
            <Link href="/auth-selection?type=signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
