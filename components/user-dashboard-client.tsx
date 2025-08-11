"use client"

import { useState, useCallback } from "react"
import ComplaintForm from "@/components/complaint-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import StatusBadge from "@/components/status-badge"
import ViewComplaintModal from "@/components/view-complaint-modal"

interface Complaint {
  _id: string
  title: string
  description: string
  category: "Product" | "Service" | "Support"
  priority: "Low" | "Medium" | "High"
  status: "Pending" | "In Progress" | "Resolved"
  userId: string
  createdAt: string
}

interface UserDashboardClientProps {
  initialComplaints: Complaint[]
  initialError: string | null
}

export default function UserDashboardClient({ initialComplaints, initialError }: UserDashboardClientProps) {
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints || [])
  const [error, setError] = useState<string | null>(initialError)
  const [showComplaintForm, setShowComplaintForm] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)

  const fetchUserComplaints = useCallback(async () => {
    setError(null)
    try {
      const response = await fetch("/api/complaints", {
        cache: "no-store",
        credentials: "same-origin",
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch complaints.")
      }
      setComplaints(data.complaints as Complaint[])
    } catch (err: any) {
      console.error("Error fetching user complaints:", err)
      setError(err.message || "Failed to load complaints.")
    }
  }, [])

  const handleFormSubmissionSuccess = () => {
    setShowComplaintForm(false)
    fetchUserComplaints()
  }

  const handleRowClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-2">
          <CardTitle className="text-xl sm:text-2xl font-bold">Your Submitted Complaints</CardTitle>
          <Button onClick={() => setShowComplaintForm(true)} size="sm" className="sm:size-default">
            Submit New Complaint
          </Button>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {complaints.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow
                      key={complaint._id}
                      onClick={() => handleRowClick(complaint)}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <TableCell className="font-medium">
                        <div className="truncate max-w-[200px] sm:max-w-none">{complaint.title}</div>
                        <div className="text-sm text-gray-500 sm:hidden">{complaint.category}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{complaint.category}</TableCell>
                      <TableCell>
                        <StatusBadge status={complaint.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {(() => {
                          const date = new Date(complaint.createdAt)
                          const month = String(date.getMonth() + 1).padStart(2, "0")
                          const day = String(date.getDate()).padStart(2, "0")
                          const year = date.getFullYear()
                          return `${month}/${day}/${year}`
                        })()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No complaints submitted yet.</p>
          )}
        </CardContent>
      </Card>

      {showComplaintForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Complaint Submission</CardTitle>
          </CardHeader>
          <CardContent>
            <ComplaintForm onSubmissionSuccess={handleFormSubmissionSuccess} />
            <Button
              variant="outline"
              className="mt-4 w-full bg-transparent"
              onClick={() => setShowComplaintForm(false)}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedComplaint && (
        <ViewComplaintModal complaint={selectedComplaint} onClose={() => setSelectedComplaint(null)} />
      )}
    </>
  )
}
