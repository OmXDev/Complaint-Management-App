"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  type SortingState,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Trash2, ArrowUpDown } from "lucide-react"
import StatusBadge from "./status-badge"
import { useRouter, useSearchParams } from "next/navigation"
import { Label } from "@/components/ui/label"
import ViewComplaintModal from "./view-complaint-modal"
import { updateComplaintStatus, deleteComplaint } from "@/actions/complaints"

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

interface ComplaintTableProps {
  complaints: Complaint[]
  error: string | null
  initialStatusFilter: string
  initialPriorityFilter: string
}

export default function ComplaintTable({
  complaints,
  error,
  initialStatusFilter,
  initialPriorityFilter,
}: ComplaintTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)
  const [priorityFilter, setPriorityFilter] = useState(initialPriorityFilter)
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)

  const handleRowClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
  }

  const handleStatusChange = async (complaintId: string, newStatus: Complaint["status"]) => {
    try {
      await updateComplaintStatus(complaintId, newStatus)
      router.refresh() // Refresh the page to show updated data
    } catch (error) {
      console.error("Failed to update status:", error)
    }
  }

  const handleDelete = async (complaintId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent row click
    if (confirm("Are you sure you want to delete this complaint?")) {
      try {
        await deleteComplaint(complaintId)
        router.refresh() // Refresh the page to show updated data
      } catch (error) {
        console.error("Failed to delete complaint:", error)
      }
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (statusFilter !== "all") {
      params.set("status", statusFilter)
    } else {
      params.delete("status")
    }
    if (priorityFilter !== "all") {
      params.set("priority", priorityFilter)
    } else {
      params.delete("priority")
    }
    router.replace(`?${params.toString()}`)
  }, [statusFilter, priorityFilter, router, searchParams])

  const columns: ColumnDef<Complaint>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold"
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">
            <div className="truncate max-w-[200px] sm:max-w-none">{row.getValue("title")}</div>
            <div className="text-sm text-gray-500 sm:hidden">
              {row.original.category} • {row.original.priority}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hidden sm:flex"
          >
            Category
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div className="hidden sm:block">{row.getValue("category")}</div>,
      },
      {
        accessorKey: "priority",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hidden sm:flex"
          >
            Priority
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div className="hidden sm:block">{row.getValue("priority")}</div>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const currentStatus: Complaint["status"] = row.getValue("status")
          return (
            <div className="flex items-center">
              <StatusBadge status={currentStatus} />
            </div>
          )
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hidden md:flex"
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = new Date(row.getValue("createdAt"))
          return (
            <div className="hidden md:block">
              {`${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear()}`}
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1 sm:gap-2">
            <Select
              value={row.original.status}
              onValueChange={(newStatus: Complaint["status"]) => handleStatusChange(row.original._id, newStatus)}
            >
              <SelectTrigger className="w-[100px] sm:w-[120px] text-xs sm:text-sm" onClick={(e) => e.stopPropagation()}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent onClick={(e) => e.stopPropagation()}>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => handleDelete(row.original._id, e)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="sr-only">Delete complaint</span>
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  const table = useReactTable({
    data: complaints,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    initialState: {
      columnVisibility: {
        description: false,
      },
    },
  })

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Complaint Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Label htmlFor="status-filter" className="text-sm whitespace-nowrap">
              Status:
            </Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter" className="w-full sm:w-[160px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Label htmlFor="priority-filter" className="text-sm whitespace-nowrap">
              Priority:
            </Label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger id="priority-filter" className="w-full sm:w-[160px]">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {complaints.length === 0 && !error ? (
          <p className="text-center text-gray-500 py-8">No complaints found matching the filters.</p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} className="px-2 sm:px-4">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      onClick={() => handleRowClick(row.original)}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-2 sm:px-4 py-2 sm:py-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Render the modal if a complaint is selected */}
      {selectedComplaint && (
        <ViewComplaintModal complaint={selectedComplaint} onClose={() => setSelectedComplaint(null)} />
      )}
    </Card>
  )
}
