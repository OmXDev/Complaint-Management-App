import mongoose, { Schema, type Document } from "mongoose"

export interface IComplaint extends Document {
  title: string
  description: string
  category: "Product" | "Service" | "Support"
  priority: "Low" | "Medium" | "High"
  status: "Pending" | "In Progress" | "Resolved"
  userId: mongoose.Schema.Types.ObjectId
  createdAt: Date
}

const ComplaintSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ["Product", "Service", "Support"], required: true },
  priority: { type: String, enum: ["Low", "Medium", "High"], required: true },
  status: { type: String, enum: ["Pending", "In Progress", "Resolved"], default: "Pending" },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
})

const Complaint = mongoose.models.Complaint || mongoose.model<IComplaint>("Complaint", ComplaintSchema)

export default Complaint
