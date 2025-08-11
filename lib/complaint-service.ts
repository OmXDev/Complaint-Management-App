import { z } from "zod"
import dbConnect from "@/lib/db"
import Complaint from "@/lib/models/complaint"
import User from "@/lib/models/user"
import { sendEmail } from "@/lib/email"

const complaintSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  description: z.string().min(20, "Description must be at least 20 characters long."),
  category: z.enum(["Product", "Service", "Support"], { message: "Invalid category selected." }),
  priority: z.enum(["Low", "Medium", "High"], { message: "Invalid priority selected." }),
})

export async function createComplaintService(
  userId: string,
  userRole: string,
  data: {
    title: string
    description: string
    category: "Product" | "Service" | "Support"
    priority: "Low" | "Medium" | "High"
  },
) {
  const validatedFields = complaintSchema.safeParse(data)

  if (!validatedFields.success) {
    // Stringify errors to pass them through the API response
    throw new Error(
      JSON.stringify({ message: "Validation failed.", errors: validatedFields.error.flatten().fieldErrors }),
    )
  }

  const { title, description, category, priority } = validatedFields.data

  await dbConnect()

  try {
    const newComplaint = await Complaint.create({
      title,
      description,
      category,
      priority,
      userId,
      status: "Pending", // Default status
    })

    const submittingUser = await User.findById(userId)
    const adminUser = await User.findOne({ role: "admin" }) // Find an admin to notify

    // Email to User on New Complaint Submission
    if (submittingUser && submittingUser.email) {
      const userEmail = submittingUser.email
      const username = submittingUser.username || "User"
      const subject = `Your Complaint "${newComplaint.title}" Has Been Submitted`
      const text = `Dear ${username},\n\nYour complaint "${newComplaint.title}" has been successfully submitted.\n\nDetails:\nCategory: ${newComplaint.category}\nPriority: ${newComplaint.priority}\nDescription: ${newComplaint.description}\n\nWe will review it shortly.`
      const html = `<p>Dear ${username},</p><p>Your complaint "<strong>${newComplaint.title}</strong>" has been successfully submitted.</p><p><strong>Details:</strong></p><ul><li><strong>Category:</strong> ${newComplaint.category}</li><li><strong>Priority:</strong> ${newComplaint.priority}</li><li><strong>Description:</strong> ${newComplaint.description}</li></ul><p>We will review it shortly.</p>`
      await sendEmail({ to: userEmail, subject, text, html })
    }

    // Email to Admin on New Complaint Submission
    if (adminUser && adminUser.email) {
      const adminEmail = adminUser.email
      const subject = `New Complaint Submitted: ${newComplaint.title}`
      const text = `A new complaint has been submitted by ${submittingUser?.username || "a user"}.\n\nTitle: ${newComplaint.title}\nCategory: ${newComplaint.category}\nPriority: ${newComplaint.priority}\nDescription: ${newComplaint.description}\n\nComplaint ID: ${newComplaint._id}`
      const html = `<p>A new complaint has been submitted by <strong>${submittingUser?.username || "a user"}</strong>.</p><p><strong>Details:</strong></p><ul><li><strong>Title:</strong> ${newComplaint.title}</li><li><strong>Category:</strong> ${newComplaint.category}</li><li><strong>Priority:</strong> ${newComplaint.priority}</li><li><strong>Description:</strong> ${newComplaint.description}</li></ul><p><strong>Complaint ID:</strong> ${newComplaint._id}</p>`
      await sendEmail({ to: adminEmail, subject, text, html })
    }

    return JSON.parse(JSON.stringify(newComplaint))
  } catch (error) {
    console.error("Error submitting complaint:", error)
    throw new Error("Failed to submit complaint. Please try again.")
  }
}

export async function getComplaintsService(
  userType: "user" | "admin",
  userId: string | null, // Explicitly pass userId for user type
  statusFilter = "all",
  priorityFilter = "all",
) {
  console.log(
    `getComplaintsService called: userType=${userType}, userId=${userId}, statusFilter=${statusFilter}, priorityFilter=${priorityFilter}`,
  )

  await dbConnect()
  const query: any = {}

  if (userType === "user") {
    if (!userId) {
      throw new Error("User ID is required for user complaints.")
    }
    query.userId = userId
  } else if (userType === "admin") {
    if (statusFilter !== "all") {
      query.status = statusFilter
    }
    if (priorityFilter !== "all") {
      query.priority = priorityFilter
    }
  } else {
    throw new Error("Unauthorized userType provided.")
  }

  console.log("getComplaintsService: Constructed query:", JSON.stringify(query))

  try {
    const complaints = await Complaint.find(query).sort({ createdAt: -1 }).populate("userId", "email username")
    console.log(`getComplaintsService: Found ${complaints.length} complaints for query.`)
    return JSON.parse(JSON.stringify(complaints))
  } catch (error) {
    console.error("Error fetching complaints:", error)
    throw new Error("Failed to fetch complaints.")
  }
}

export async function updateComplaintStatusService(
  id: string,
  newStatus: "Pending" | "In Progress" | "Resolved",
  adminId: string, // Explicitly pass adminId for logging/auth
) {
  await dbConnect()

  try {
    const complaint = await Complaint.findByIdAndUpdate(id, { status: newStatus }, { new: true }).populate(
      "userId",
      "email username",
    )

    if (!complaint) {
      throw new Error("Complaint not found.")
    }

    const adminUser = await User.findOne({ role: "admin" }) // Find an admin to notify

    // Send email notification ONLY to the admin
    if (adminUser && adminUser.email) {
      const adminEmail = adminUser.email
      const subject = `Complaint Status Updated: ${complaint.title}`
      const updateDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      const text = `The status of complaint "${complaint.title}" has been updated to: ${newStatus}.\n\nUpdated On: ${updateDate}\nComplaint ID: ${complaint._id}`
      const html = `<p>The status of complaint "<strong>${complaint.title}</strong>" has been updated to: <strong>${newStatus}</strong>.</p><p><strong>Updated On:</strong> ${updateDate}</p><p><strong>Complaint ID:</strong> ${complaint._id}</p>`

      await sendEmail({ to: adminEmail, subject, text, html })
    }

    return JSON.parse(JSON.stringify(complaint))
  } catch (error) {
    console.error("Error updating complaint status:", error)
    throw new Error("Failed to update complaint status.")
  }
}

export async function deleteComplaintService(id: string, adminId: string) {
  await dbConnect()

  try {
    const result = await Complaint.findByIdAndDelete(id)
    if (!result) {
      throw new Error("Complaint not found.")
    }
    return { success: true, message: "Complaint deleted successfully." }
  } catch (error) {
    console.error("Error deleting complaint:", error)
    throw new Error("Failed to delete complaint.")
  }
}
