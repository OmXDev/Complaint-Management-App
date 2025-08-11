import { NextResponse } from "next/server"
import { authenticateApiRequest } from "@/lib/auth"
import { createComplaintService, getComplaintsService } from "@/lib/complaint-service"
import { AuthError } from "@/lib/errors"

export async function POST(request: Request) {
  try {
    const { id: userId, role: userRole } = await authenticateApiRequest(request, ["user"])
    const data = await request.json()

    const newComplaint = await createComplaintService(userId, userRole, data)
    return NextResponse.json({ success: true, complaint: newComplaint }, { status: 201 })
  } catch (error) {
    console.error("API POST /api/complaints error:", error)
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode })
    }
    let message = "Failed to create complaint."
    let errors = {}
    try {
      if (typeof error === "object" && error !== null && "message" in error && typeof (error as any).message === "string") {
        const parsedError = JSON.parse((error as any).message)
        if (parsedError.message) message = parsedError.message
        if (parsedError.errors) errors = parsedError.errors
      }
    } catch (e) {
      // Not a JSON error message, use default
    }
    return NextResponse.json({ success: false, message, errors }, { status: 400 })
  }
}

export async function GET(request: Request) {
  try {
    const { id: userId, role: userRole } = await authenticateApiRequest(request, ["user", "admin"])
    const { searchParams } = new URL(request.url)

    const statusFilter = searchParams.get("status") || "all"
    const priorityFilter = searchParams.get("priority") || "all"

    const complaints = await getComplaintsService(userRole as "user" | "admin", userId, statusFilter, priorityFilter)
    return NextResponse.json({ success: true, complaints }, { status: 200 })
  } catch (error) {
    console.error("API GET /api/complaints error:", error)
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ success: false, message: "Failed to fetch complaints." }, { status: 500 })
  }
}
