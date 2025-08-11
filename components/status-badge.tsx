import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
  status: "Pending" | "In Progress" | "Resolved"
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "secondary"
  let className = ""

  switch (status) {
    case "Pending":
      variant = "secondary"
      className = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      break
    case "In Progress":
      variant = "default"
      className = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      break
    case "Resolved":
      variant = "default"
      className = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      break
    default:
      variant = "secondary"
      break
  }

  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  )
}
