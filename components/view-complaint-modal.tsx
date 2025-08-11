import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import StatusBadge from "./status-badge"

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

interface ViewComplaintModalProps {
  complaint: Complaint
  onClose: () => void
}

export default function ViewComplaintModal({ complaint, onClose }: ViewComplaintModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{complaint.title}</DialogTitle>
          <DialogDescription>Details of your complaint.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-medium col-span-1">Category:</span>
            <Badge variant="outline" className="col-span-3 w-fit">
              {complaint.category}
            </Badge>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-medium col-span-1">Priority:</span>
            <Badge variant="outline" className="col-span-3 w-fit">
              {complaint.priority}
            </Badge>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-medium col-span-1">Status:</span>
            <div className="col-span-3">
              <StatusBadge status={complaint.status} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <span className="text-sm font-medium col-span-1">Description:</span>
            <p className="text-sm text-gray-500 dark:text-gray-400 col-span-3">{complaint.description}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-medium col-span-1">Submitted:</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 col-span-3">
              {new Date(complaint.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
