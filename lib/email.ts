import nodemailer from "nodemailer"

const EMAIL_USER = process.env.EMAIL_USER
const EMAIL_PASS = process.env.EMAIL_PASS

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn("Email credentials not set. Email notifications will not be sent.")
}

const transporter = nodemailer.createTransport({
  service: "gmail", // You can use other services like 'outlook', 'yahoo', etc.
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
})

interface SendEmailOptions {
  to: string
  subject: string
  text: string
  html: string
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn("Email sending skipped: EMAIL_USER or EMAIL_PASS is not defined.")
    return { success: false, message: "Email service not configured." }
  }

  try {
    await transporter.sendMail({
      from: `"Complaint App" <${EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    })
    console.log(`Email sent to ${to} with subject: ${subject}`)
    return { success: true, message: "Email sent successfully." }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, message: "Failed to send email." }
  }
}
