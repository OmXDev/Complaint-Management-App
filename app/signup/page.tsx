import AuthForm from "@/components/auth-form"
import Link from "next/link"
import { isAuthenticated } from "@/lib/auth" // Import isAuthenticated
import { redirect } from "next/navigation" // Import redirect

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const awaitedSearchParams = await searchParams
  const initialRole = awaitedSearchParams.role as "user" | "admin" | undefined

  // Check if user is already authenticated
  const { id, role } = await isAuthenticated()
  if (id && role) {
    console.log(`SignupPage: User already authenticated as ${role}. Redirecting to dashboard.`)
    redirect(role === "admin" ? "/admin/dashboard" : "/user/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12 dark:bg-gray-950">
      <div className="mx-auto w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-900">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Sign Up</h1>
          <p className="text-gray-500 dark:text-gray-400">Create a new {initialRole || ""} account to get started.</p>
        </div>
        <AuthForm type="signup" initialRole={initialRole} />
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link
            href={`/auth-selection?type=login`}
            className="font-medium text-blue-600 hover:underline dark:text-blue-500"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}
