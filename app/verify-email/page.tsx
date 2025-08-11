"use client"

import { useActionState, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { verifyEmailOtp } from "@/actions/auth"
import { useRouter, useSearchParams } from "next/navigation"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get("email") || ""

  const [state, action, pending] = useActionState(verifyEmailOtp, { message: "", errors: {} })
  const [email, setEmail] = useState(initialEmail)

  useEffect(() => {
    if (state?.success) {
      // Redirection is handled by the Server Action, but we can show a success message
      // before the redirect happens.
      console.log("Email verified successfully! Redirecting...")
    }
  }, [state])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12 dark:bg-gray-950">
      <Card className="mx-auto w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-900">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            An OTP has been sent to <span className="font-medium text-blue-600">{email}</span>. Please enter it below to
            verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <input type="hidden" name="email" value={email} />
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code (OTP)</Label>
              <Input
                id="otp"
                name="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
              />
              {state?.errors?.otp && <p className="text-sm text-red-500">{state.errors.otp}</p>}
            </div>
            {state?.message && (
              <p className={`text-sm ${state.success ? "text-green-500" : "text-red-500"}`}>{state.message}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Verifying..." : "Verify Email"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
