"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import dbConnect from "@/lib/db"
import User from "@/lib/models/user"
import { signToken } from "@/lib/auth"
import { sendEmail } from "@/lib/email" // Import sendEmail

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  role: z.enum(["user", "admin"], { message: "Invalid role selected." }),
})

const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
})

const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address."),
  otp: z.string().length(6, "OTP must be 6 digits.").regex(/^\d+$/, "OTP must be digits only."),
})

interface AuthState {
  success?: boolean
  message?: string
  errors?: {
    username?: string[]
    email?: string[]
    password?: string[]
    role?: string[]
    otp?: string[]
  }
  redirectPath?: string // Keep this for client-side redirect to verify-email
}

// Helper to generate OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString() // 6-digit OTP
}

export async function signup(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const validatedFields = signupSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  })

  if (!validatedFields.success) {
    return {
      message: "Validation failed.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { username, email, password, role } = validatedFields.data

  await dbConnect()

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] })
    if (existingUser) {
      return { message: "User with this email or username already exists." }
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const otp = generateOtp()
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // OTP valid for 10 minutes

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
      isVerified: false, // User is unverified initially
      verificationOtp: otp,
      otpExpires: otpExpires,
    })

    // Send OTP email
    const emailSubject = "Verify Your Email for Complaint Management App"
    const emailText = `Your OTP for email verification is: ${otp}. It is valid for 10 minutes.`
    const emailHtml = `<p>Your OTP for email verification is: <strong>${otp}</strong>.</p><p>It is valid for 10 minutes.</p>`
    await sendEmail({ to: email, subject: emailSubject, text: emailText, html: emailHtml })

    // Do NOT set auth cookie here. User must verify email first.
    return {
      success: true,
      message: "Signup successful! Please check your email for a verification OTP.",
      redirectPath: `/verify-email?email=${encodeURIComponent(email)}`, // Redirect to verification page
    }
  } catch (error) {
    // Re-throw NEXT_REDIRECT errors so Next.js can handle them
    if (error && typeof error === "object" && "digest" in error && error.digest === "NEXT_REDIRECT") {
      throw error
    }
    console.error("Signup error:", error)
    return { message: "An unexpected error occurred during signup." }
  }
}

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const validatedFields = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validatedFields.success) {
    return {
      message: "Validation failed.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validatedFields.data

  await dbConnect()

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return { message: "Invalid credentials." }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return { message: "Invalid credentials." }
    }

    // Check if email is verified
    if (!user.isVerified) {
      // If not verified, resend OTP and redirect to verification page
      const otp = generateOtp()
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000)
      user.verificationOtp = otp
      user.otpExpires = otpExpires
      await user.save()

      const emailSubject = "Verify Your Email for Complaint Management App"
      const emailText = `Your OTP for email verification is: ${otp}. It is valid for 10 minutes.`
      const emailHtml = `<p>Your OTP for email verification is: <strong>${otp}</strong>.</p><p>It is valid for 10 minutes.</p>`
      await sendEmail({ to: email, subject: emailSubject, text: emailText, html: emailHtml })

      return {
        success: false,
        message: "Please verify your email. An OTP has been sent to your email address.",
        redirectPath: `/verify-email?email=${encodeURIComponent(email)}`,
      }
    }

    const token = await signToken({ id: user._id.toString(), role: user.role })
    ;(await cookies()).set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/",
    })

    redirect(user.role === "admin" ? "/admin/dashboard" : "/user/dashboard")
  } catch (error) {
    // Re-throw NEXT_REDIRECT errors so Next.js can handle them
    if (error && typeof error === "object" && "digest" in error && error.digest === "NEXT_REDIRECT") {
      throw error
    }
    console.error("Login error:", error)
    return { message: "An unexpected error occurred during login." }
  }
}

export async function logout() {
  (await cookies()).delete("auth_token")
  redirect("/login")
}

export async function verifyEmailOtp(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const validatedFields = verifyOtpSchema.safeParse({
    email: formData.get("email"),
    otp: formData.get("otp"),
  })

  if (!validatedFields.success) {
    return {
      message: "Validation failed.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, otp } = validatedFields.data

  await dbConnect()

  try {
    const user = await User.findOne({ email })

    if (!user) {
      return { message: "User not found." }
    }

    if (user.verificationOtp !== otp) {
      return { message: "Invalid OTP." }
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
      return { message: "OTP expired. Please request a new one." }
    }

    user.isVerified = true
    user.verificationOtp = undefined // Clear OTP
    user.otpExpires = undefined // Clear expiration
    await user.save()

    // Now that email is verified, sign the token and redirect
    const token = await signToken({ id: user._id.toString(), role: user.role })
    ;(await cookies()).set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/",
    })

    redirect(user.role === "admin" ? "/admin/dashboard" : "/user/dashboard")
  } catch (error) {
    // Re-throw NEXT_REDIRECT errors
    if (error && typeof error === "object" && "digest" in error && error.digest === "NEXT_REDIRECT") {
      throw error
    }
    console.error("OTP verification error:", error)
    return { message: "An unexpected error occurred during OTP verification." }
  }
}
