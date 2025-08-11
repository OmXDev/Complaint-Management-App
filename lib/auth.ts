import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import dbConnect from "@/lib/db" // Corrected import path
import User from "@/lib/models/user" // Corrected import path
import { AuthError } from "./errors" // New import

const secretKey = process.env.JWT_SECRET
if (!secretKey) {
  console.error("JWT_SECRET environment variable is not set!")
}
const encodedKey = new TextEncoder().encode(secretKey || "default_secret_for_dev_only_do_not_use_in_prod")

export async function signToken(payload: { id: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h") // Token expires in 2 hours
    .sign(encodedKey)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    })
    console.log("Token verified successfully. Payload:", payload)
    return payload as { id: string; role: string }
  } catch (error) {
    console.error("Token verification failed in verifyToken:", error)
    throw new Error("Invalid or expired token")
  }
}

export async function getUserIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value
  if (!token) return null

  try {
    const decoded = await verifyToken(token)
    return decoded.id
  } catch (error) {
    return null
  }
}

export async function getUserRoleFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value
  if (!token) return null

  try {
    const decoded = await verifyToken(token)
    return decoded.role
  } catch (error) {
    return null
  }
}

export async function isAuthenticated(): Promise<{ id: string | null; role: string | null; isVerified: boolean }> {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    return { id: null, role: null, isVerified: false }
  }

  try {
    const decoded = await verifyToken(token)
    await dbConnect() // Ensure DB connection for user lookup
    const user = await User.findById(decoded.id)
    if (!user) {
      console.error("isAuthenticated: User not found for token ID.")
      cookieStore.delete("auth_token")
      return { id: null, role: null, isVerified: false }
    }
    return { id: decoded.id, role: decoded.role, isVerified: user.isVerified }
  } catch (error) {
    console.error("isAuthenticated: Token verification failed, deleting cookie.", error)
    cookieStore.delete("auth_token")
    return { id: null, role: null, isVerified: false }
  }
}

export async function requireAuth(allowedRoles: string[]) {
  const { id, role, isVerified } = await isAuthenticated()

  if (!id || !role || !allowedRoles.includes(role)) {
    console.log(
      `requireAuth: Unauthorized access. ID: ${id}, Role: ${role}, Allowed: ${allowedRoles.join(", ")}. Redirecting to /login.`,
    )
    redirect("/login")
  }

  if (!isVerified) {
    console.log(`requireAuth: User ${id} is not verified. Redirecting to /verify-email.`)
    // Fetch user email to pass to verify-email page
    await dbConnect()
    const user = await User.findById(id)
    redirect(`/verify-email?email=${encodeURIComponent(user?.email || "")}`)
  }

  return { id, role }
}

// New function for API route authentication
export async function authenticateApiRequest(request: Request, allowedRoles: string[]) {
  // Get cookies from the request headers instead of using the cookies() function
  const cookieHeader = request.headers.get("cookie")
  let token: string | undefined

  if (cookieHeader) {
    const cookies = cookieHeader.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=")
        acc[key] = value
        return acc
      },
      {} as Record<string, string>,
    )
    token = cookies["auth_token"]
  }

  if (!token) {
    throw new AuthError("Authentication required.", 401)
  }

  try {
    const decoded = await verifyToken(token)
    const { id, role } = decoded

    await dbConnect()
    const user = await User.findById(id)

    if (!user || !allowedRoles.includes(user.role) || !user.isVerified) {
      throw new AuthError("Unauthorized access or unverified account.", 403)
    }

    return { id: user._id.toString(), role: user.role, isVerified: user.isVerified }
  } catch (error) {
    if (error instanceof AuthError) {
      throw error
    }
    console.error("API authentication failed:", error)
    throw new AuthError("Invalid or expired token.", 401)
  }
}
