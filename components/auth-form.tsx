"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { signup, login } from "@/actions/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface AuthFormProps {
  type: "login" | "signup"
  initialRole?: "user" | "admin"
}

export default function AuthForm({ type, initialRole }: AuthFormProps) {
  const router = useRouter()
  const [signupState, signupAction, signupPending] = useActionState(signup, { message: "", errors: {} })
  const [loginState, loginAction, loginPending] = useActionState(login, { message: "", errors: {} })

  const action = type === "signup" ? signupAction : loginAction
  const state = type === "signup" ? signupState : loginState
  const pending = type === "signup" ? signupPending : loginPending

  useEffect(() => {
    // If the action returns a redirectPath, navigate to it client-side
    // This is used for redirecting to /verify-email after signup or unverified login
    if (state?.redirectPath) {
      router.push(state.redirectPath)
    }
    // For successful login/signup (after verification), the Server Action handles the redirect directly.
  }, [state, router])

  return (
    <form action={action} className="space-y-4">
      {type === "signup" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" placeholder="Enter your username" required />
            {state?.errors?.username && <p className="text-sm text-red-500">{state.errors.username}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
            {state?.errors?.email && <p className="text-sm text-red-500">{state.errors.email}</p>}
          </div>
          {initialRole ? (
            <input type="hidden" name="role" value={initialRole} />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <RadioGroup defaultValue="user" id="role" name="role" className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="user" id="role-user" />
                  <Label htmlFor="role-user">User</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="role-admin" />
                  <Label htmlFor="role-admin">Admin</Label>
                </div>
              </RadioGroup>
              {state?.errors?.role && <p className="text-sm text-red-500">{state.errors.role}</p>}
            </div>
          )}
        </>
      )}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" placeholder="Enter your password" required />
        {state?.errors?.password && <p className="text-sm text-red-500">{state.errors.password}</p>}
      </div>
      {type === "login" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
            {state?.errors?.email && <p className="text-sm text-red-500">{state.errors.email}</p>}
          </div>
          {initialRole && <input type="hidden" name="role" value={initialRole} />}
        </>
      )}
      {state?.message && <p className="text-sm text-red-500">{state.message}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (type === "signup" ? "Signing Up..." : "Logging In...") : type === "signup" ? "Sign Up" : "Login"}
      </Button>
    </form>
  )
}
