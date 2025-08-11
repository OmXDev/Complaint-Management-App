import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { isAuthenticated } from "@/lib/auth" // Import isAuthenticated
import { redirect } from "next/navigation" // Import redirect

export default async function AuthSelectionPage({ searchParams }: { searchParams: { type?: string } }) {
  const authType = searchParams.type || "auth" // 'login' or 'signup'

  // Check if user is already authenticated
  const { id, role } = await isAuthenticated()
  if (id && role) {
    console.log(`AuthSelectionPage: User already authenticated as ${role}. Redirecting to dashboard.`)
    redirect(role === "admin" ? "/admin/dashboard" : "/user/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12 dark:bg-gray-950">
      <Card className="mx-auto w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-900">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{authType === "login" ? "Login" : "Sign Up"} as...</CardTitle>
          <CardDescription>Choose your role to proceed.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button asChild size="lg" className="w-full">
            <Link href={`/${authType}?role=user`}>{authType === "login" ? "Login as User" : "Sign Up as User"}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full bg-transparent">
            <Link href={`/${authType}?role=admin`}>{authType === "login" ? "Login as Admin" : "Sign Up as Admin"}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
