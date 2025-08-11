import { NextResponse } from "next/server"
import { authenticateApiRequest } from "@/lib/auth"
import { updateComplaintStatusService, deleteComplaintService } from "@/lib/complaint-service"
import { AuthError } from "@/lib/errors"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: adminId, role: adminRole } = await authenticateApiRequest(request, ["admin"])
    const complaintId = params.id
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json({ success: false, message: "Status is required." }, { status: 400 })
    }

    const updatedComplaint = await updateComplaintStatusService(complaintId, status, adminId)
    return NextResponse.json({ success: true, complaint: updatedComplaint }, { status: 200 })
  } catch (error) {
    console.error("API PATCH /api/complaints/[id] error:", error)
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ success: false, message: "Failed to update complaint status." }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: adminId, role: adminRole } = await authenticateApiRequest(request, ["admin"])
    const complaintId = params.id

    const result = await deleteComplaintService(complaintId, adminId)
    return NextResponse.json({ success: true, message: result.message }, { status: 200 })
  } catch (error) {
    console.error("API DELETE /api/complaints/[id] error:", error)
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ success: false, message: "Failed to delete complaint." }, { status: 500 })
  }
}
