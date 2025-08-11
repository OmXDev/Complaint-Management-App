import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"
import { cookies, headers } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { redirect } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Complaint Management App",
  description: "A full-stack complaint management system for users and admins.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  let userRole: string | null = null
  let userId: string | null = null

  if (token) {
    try {
      const decoded = await verifyToken(token)
      userRole = decoded.role
      userId = decoded.id
    } catch (error) {
      console.error("Invalid token in RootLayout:", error)
      // If token is invalid, userRole/userId remain null, and subsequent logic will redirect to login.
    }
  }

  const requestHeaders = await headers()
  // Using x-pathname as it's generally reliable for the current route path
  const currentPathname = requestHeaders.get("x-pathname") || "/"

  // --- DEBUG LOGS ---
  console.log("--- RootLayout Auth Check ---")
  console.log("Current Pathname (derived):", currentPathname)
  console.log("Token present:", !!token)
  console.log("User Role:", userRole)
  console.log("User ID:", userId)
  console.log("-----------------------------")
  // --- END DEBUG LOGS ---

  // Condition: Unauthenticated users trying to access protected dashboards
  // This is the ONLY redirect logic remaining in layout.tsx
  if (!token && (currentPathname.startsWith("/user") || currentPathname.startsWith("/admin"))) {
    console.log("Redirecting unauthenticated user from protected page to /login")
    redirect("/login")
  }

  // All other authentication redirects will now be handled by specific pages.

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
