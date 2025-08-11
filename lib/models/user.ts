import mongoose, { Schema, type Document } from "mongoose"

export interface IUser extends Document {
  username: string
  email: string
  password: string
  role: "user" | "admin"
  isVerified: boolean // New field
  verificationOtp?: string // New field
  otpExpires?: Date // New field
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  isVerified: { type: Boolean, default: false }, // Default to false
  verificationOtp: { type: String },
  otpExpires: { type: Date },
})

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)

export default User
