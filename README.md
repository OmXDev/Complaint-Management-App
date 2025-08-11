# Complaint Management System

A full-stack web application built with Next.js 15, TypeScript, MongoDB, and Nodemailer for managing customer complaints with separate user and admin interfaces.

## Features

- **User Authentication**: Secure login/signup with email verification using OTP
- **Role-based Access**: Separate dashboards for users and administrators
- **Complaint Management**: Users can submit complaints, admins can manage and update status
- **Email Notifications**: Automated email notifications for complaint submissions and status updates
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Real-time Updates**: Dynamic status updates with email notifications

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Backend**: Next.js API Routes, Server Actions
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with secure cookie storage
- **Email Service**: Nodemailer (Gmail SMTP)
- **Validation**: Zod schema validation

## Prerequisites

Before running this application, make sure you have:

- Node.js 18+ installed
- MongoDB database (local or cloud)
- Gmail account for email notifications (or other SMTP service)

## Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd complaint-management-app
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   \`\`\`env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/complaint-management
   # or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/complaint-management

   # JWT Secret (generate a secure random string)
   JWT_SECRET=your-super-secure-jwt-secret-key-here

   # Email Configuration (Gmail)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password

   # Base URL (for production deployment)
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   \`\`\`

## MongoDB Setup

### Option 1: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/complaint-management`

### Option 2: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string from "Connect" → "Connect your application"
4. Replace `<username>`, `<password>`, and `<cluster-url>` in connection string

## Email Configuration

### Gmail Setup (Recommended)
1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to Google Account Settings → Security
   - Under "How you sign in to Google" → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password
3. **Update environment variables**:
   \`\`\`env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   \`\`\`

### Other Email Services
Update the transporter configuration in `lib/email.ts`:
\`\`\`javascript
const transporter = nodemailer.createTransporter({
  host: 'smtp.your-provider.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
\`\`\`

## Running the Application

1. **Development mode**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`
   Open [http://localhost:3000](http://localhost:3000)

2. **Production build**
   \`\`\`bash
   npm run build
   npm start
   # or
   yarn build
   yarn start
   \`\`\`

## Usage Guide

### For Users
1. **Registration**: Sign up with email and password
2. **Email Verification**: Enter OTP sent to your email
3. **Submit Complaints**: Fill out the complaint form with title, description, category, and priority
4. **Track Status**: View your complaints and their current status in the dashboard
5. **Email Updates**: Receive notifications when complaint status changes

### For Administrators
1. **Admin Access**: Login with admin credentials
2. **View All Complaints**: See all complaints from all users with filtering options
3. **Update Status**: Change complaint status (Pending → In Progress → Resolved)
4. **Delete Complaints**: Remove complaints if necessary
5. **Email Notifications**: Receive notifications for new complaints and send updates to users

## API Endpoints

- `POST /api/complaints` - Create new complaint (authenticated users)
- `GET /api/complaints` - Get complaints (filtered by user role)
- `PATCH /api/complaints/[id]` - Update complaint status (admin only)
- `DELETE /api/complaints/[id]` - Delete complaint (admin only)

## Project Structure

\`\`\`
complaint-management-app/
├── app/                          # Next.js App Router
│   ├── admin/dashboard/          # Admin dashboard page
│   ├── user/dashboard/           # User dashboard page
│   ├── api/complaints/           # API routes
│   ├── login/                    # Login page
│   ├── signup/                   # Signup page
│   └── verify-email/             # Email verification page
├── components/                   # Reusable React components
│   ├── complaint-form.tsx        # Complaint submission form
│   ├── complaint-table.tsx       # Admin complaint management table
│   └── auth-form.tsx             # Authentication forms
├── lib/                          # Utility functions and configurations
│   ├── models/                   # MongoDB schemas
│   ├── auth.ts                   # Authentication utilities
│   ├── db.ts                     # Database connection
│   └── email.ts                  # Email service configuration
└── actions/                      # Server actions
    ├── auth.ts                   # Authentication actions
    └── complaints.ts             # Complaint management actions
\`\`\`

## Screenshots

### Landing Page
![Landing Page](screenshots/landing-page.png)
*Clean and professional landing page with login/signup options*

### User Dashboard
![User Dashboard](screenshots/user-dashboard.png)
*User-friendly dashboard showing personal complaints and submission form*

### Admin Dashboard
![Admin Dashboard](screenshots/admin-dashboard.png)
*Comprehensive admin interface with filtering and management capabilities*

### Mobile Responsive
![Mobile View](screenshots/mobile-view.png)
*Fully responsive design optimized for mobile devices*

## Deployment

### Vercel (Recommended)
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
- Ensure Node.js 18+ support
- Set all environment variables
- Run `npm run build` before deployment

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `MONGODB_URI` | MongoDB connection string | Yes | `mongodb://localhost:27017/complaints` |
| `JWT_SECRET` | Secret key for JWT tokens | Yes | `your-super-secure-secret-key` |
| `EMAIL_USER` | Email service username | Yes | `your-email@gmail.com` |
| `EMAIL_PASS` | Email service password/app password | Yes | `your-app-password` |
| `NEXT_PUBLIC_BASE_URL` | Base URL for the application | No | `https://your-app.vercel.app` |

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Verify Gmail app password is correct
   - Check spam folder
   - Ensure 2FA is enabled on Google account

2. **Database connection failed**
   - Verify MongoDB is running (local) or connection string is correct (Atlas)
   - Check network connectivity and firewall settings

3. **Authentication issues**
   - Ensure JWT_SECRET is set and consistent
   - Clear browser cookies and try again

4. **Build errors**
   - Run `npm run lint` to check for code issues
   - Ensure all environment variables are set

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Email: support@your-domain.com

---

**Built with ❤️ using Next.js, TypeScript, and MongoDB**
