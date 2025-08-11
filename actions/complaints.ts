"use server"

import { z } from "zod"
import dbConnect from "@/lib/db"
import Complaint from "@/lib/models/complaint"
import User from "@/lib/models/user" // Import User model
import { requireAuth } from "@/lib/auth"
import { sendEmail } from "@/lib/email"

const complaintSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  description: z.string().min(20, "Description must be at least 20 characters long."),
  category: z.enum(["Product", "Service", "Support"], { message: "Invalid category selected." }),
  priority: z.enum(["Low", "Medium", "High"], { message: "Invalid priority selected." }),
})

interface ComplaintFormState {
  success?: boolean
  message?: string
  errors?: {
    title?: string[]
    description?: string[]
    category?: string[]
    priority?: string[]
  }
}

export async function submitComplaint(prevState: ComplaintFormState, formData: FormData): Promise<ComplaintFormState> {
  const { id: userId, role } = await requireAuth(["user"])

  const validatedFields = complaintSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    priority: formData.get("priority"),
  })

  if (!validatedFields.success) {
    return {
      message: "Validation failed.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
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

    // Fetch the user who submitted the complaint
    const submittingUser = await User.findById(userId)

    // Fetch an admin user for notifications (e.g., the first one found)
    const adminUser = await User.findOne({ role: "admin" })

    console.log("Admin user lookup result:", adminUser ? `Found admin: ${adminUser.email}` : "No admin user found")

    // Email to User on New Complaint Submission
    if (submittingUser && submittingUser.email) {
      const userEmail = submittingUser.email
      const username = submittingUser.username || "User"
      const subject = `Your Complaint "${newComplaint.title}" Has Been Submitted`
      const text = `Dear ${username},\n\nYour complaint "${newComplaint.title}" has been successfully submitted.\n\nDetails:\nCategory: ${newComplaint.category}\nPriority: ${newComplaint.priority}\nDescription: ${newComplaint.description}\n\nWe will review it shortly.`
      const html = `<p>Dear ${username},</p><p>Your complaint "<strong>${newComplaint.title}</strong>" has been successfully submitted.</p><p><strong>Details:</strong></p><ul><li><strong>Category:</strong> ${newComplaint.category}</li><li><strong>Priority:</strong> ${newComplaint.priority}</li><li><strong>Description:</strong> ${newComplaint.description}</li></ul><p>We will review it shortly.</p>`

      try {
        const userEmailResult = await sendEmail({ to: userEmail, subject, text, html })
        console.log("User email result:", userEmailResult)
      } catch (error) {
        console.error("Failed to send user email:", error)
      }
    }

    // Email to Admin on New Complaint Submission
    if (adminUser && adminUser.email) {
      const adminEmail = adminUser.email
      const subject = `New Complaint Submitted: ${newComplaint.title}`
      const text = `A new complaint has been submitted by ${submittingUser?.username || "a user"}.\n\nTitle: ${newComplaint.title}\nCategory: ${newComplaint.category}\nPriority: ${newComplaint.priority}\nDescription: ${newComplaint.description}\n\nComplaint ID: ${newComplaint._id}`
      const html = `<p>A new complaint has been submitted by <strong>${submittingUser?.username || "a user"}</strong>.</p><p><strong>Details:</strong></p><ul><li><strong>Title:</strong> ${newComplaint.title}</li><li><strong>Category:</strong> ${newComplaint.category}</li><li><strong>Priority:</strong> ${newComplaint.priority}</li><li><strong>Description:</strong> ${newComplaint.description}</li></ul><p><strong>Complaint ID:</strong> ${newComplaint._id}</p>`

      console.log(`Attempting to send admin notification email to: ${adminEmail}`)
      try {
        const adminEmailResult = await sendEmail({ to: adminEmail, subject, text, html })
        console.log("Admin email result:", adminEmailResult)
        if (!adminEmailResult.success) {
          console.error("Admin email failed:", adminEmailResult.message)
        }
      } catch (error) {
        console.error("Failed to send admin email:", error)
      }
    } else {
      console.warn("No admin user found or admin user has no email address. Admin notification not sent.")
    }

    return { success: true, message: "Complaint submitted successfully!" }
  } catch (error) {
    console.error("Error submitting complaint:", error)
    return { message: "Failed to submit complaint. Please try again." }
  }
}

export async function getComplaints(userType: "user" | "admin", statusFilter = "all", priorityFilter = "all") {
  console.log(
    `getComplaints called: userType=${userType}, statusFilter=${statusFilter}, priorityFilter=${priorityFilter}`,
  )

  await dbConnect()
  const query: any = {}

  if (userType === "user") {
    const { id: userId, role } = await requireAuth(["user"])
    query.userId = userId
  } else if (userType === "admin") {
    await requireAuth(["admin"])
    if (statusFilter !== "all") {
      query.status = statusFilter
    }
    if (priorityFilter !== "all") {
      query.priority = priorityFilter
    }
  } else {
    console.warn("getComplaints: Unauthorized userType provided.")
    return { complaints: [], error: "Unauthorized access." }
  }

  console.log("getComplaints: Constructed query:", JSON.stringify(query))

  try {
    const complaints = await Complaint.find(query).sort({ createdAt: -1 }).populate("userId", "email username")
    console.log(`getComplaints: Found ${complaints.length} complaints for query.`)
    return { complaints: JSON.parse(JSON.stringify(complaints)), error: null }
  } catch (error) {
    console.error("Error fetching complaints:", error)
    return { complaints: [], error: "Failed to fetch complaints." }
  }
}

export async function updateComplaintStatus(id: string, newStatus: "Pending" | "In Progress" | "Resolved") {
  await requireAuth(["admin"])
  await dbConnect()

  try {
    const complaint = await Complaint.findByIdAndUpdate(id, { status: newStatus }, { new: true }).populate(
      "userId",
      "email username",
    )

    if (!complaint) {
      return { success: false, message: "Complaint not found." }
    }

    // Fetch an admin user for notifications (e.g., the first one found)
    const adminUser = await User.findOne({ role: "admin" })

    console.log(
      "Admin user lookup for status update:",
      adminUser ? `Found admin: ${adminUser.email}` : "No admin user found",
    )

    // Send email notification to the admin
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

      console.log(`Attempting to send admin status update email to: ${adminEmail}`)
      try {
        const adminEmailResult = await sendEmail({ to: adminEmail, subject, text, html })
        console.log("Admin status update email result:", adminEmailResult)
        if (!adminEmailResult.success) {
          console.error("Admin status update email failed:", adminEmailResult.message)
        }
      } catch (error) {
        console.error("Failed to send admin status update email:", error)
      }
    } else {
      console.warn("No admin user found or admin user has no email address. Admin status update notification not sent.")
    }

    // Send email notification to the user for resolved/in progress status
    if ((newStatus === "Resolved" || newStatus === "In Progress") && complaint.userId && complaint.userId.email) {
      const userEmail = complaint.userId.email
      const username = complaint.userId.username || "User"
      const subject = `Your Complaint "${complaint.title}" Status Updated`
      const updateDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

      const text = `Dear ${username},\n\nYour complaint "${complaint.title}" has been updated to: ${newStatus}.\n\nUpdated On: ${updateDate}\n\nThank you for your patience.`
      const html = `<p>Dear ${username},</p><p>Your complaint "<strong>${complaint.title}</strong>" has been updated to: <strong>${newStatus}</strong>.</p><p><strong>Updated On:</strong> ${updateDate}</p><p>Thank you for your patience.</p>`

      try {
        const userEmailResult = await sendEmail({ to: userEmail, subject, text, html })
        console.log("User status update email result:", userEmailResult)
      } catch (error) {
        console.error("Failed to send user status update email:", error)
      }
    }

    return { success: true, message: "Complaint status updated successfully." }
  } catch (error) {
    console.error("Error updating complaint status:", error)
    return { success: false, message: "Failed to update complaint status." }
  }
}

export async function deleteComplaint(id: string) {
  await requireAuth(["admin"])
  await dbConnect()

  try {
    const result = await Complaint.findByIdAndDelete(id)
    if (!result) {
      return { success: false, message: "Complaint not found." }
    }
    return { success: true, message: "Complaint deleted successfully." }
  } catch (error) {
    console.error("Error deleting complaint:", error)
    return { success: false, message: "Failed to delete complaint." }
  }
}
