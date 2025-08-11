"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface ComplaintFormProps {
  onSubmissionSuccess?: () => void
}

interface FormState {
  success?: boolean
  message?: string
  errors?: {
    title?: string[]
    description?: string[]
    category?: string[]
    priority?: string[]
  }
}

export default function ComplaintForm({ onSubmissionSuccess }: ComplaintFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, setState] = useState<FormState>({ message: "", errors: {} })
  const [pending, setPending] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    setState({ message: "", errors: {} }) // Clear previous state

    const formData = new FormData(event.currentTarget)
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      priority: formData.get("priority"),
    }

    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setState({ success: false, message: result.message || "Failed to submit complaint.", errors: result.errors })
      } else {
        setState({ success: true, message: result.message || "Complaint submitted successfully!" })
        formRef.current?.reset()
        if (onSubmissionSuccess) {
          onSubmissionSuccess()
        }
      }
    } catch (error: any) {
      console.error("Error submitting complaint:", error)
      setState({ success: false, message: error.message || "An unexpected error occurred." })
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Submit a New Complaint</CardTitle>
        <CardDescription>Fill out the form below to submit your complaint.</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4 sm:gap-6">
          <div className="grid gap-2">
            <Label htmlFor="title">Complaint Title</Label>
            <Input id="title" name="title" placeholder="Enter complaint title" required />
            {state?.errors?.title && <p className="text-sm text-red-500">{state.errors.title}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Provide a detailed description of your complaint (minimum 20 characters)"
              rows={4}
              className="resize-none"
              required
            />
            {state?.errors?.description && <p className="text-sm text-red-500">{state.errors.description}</p>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select name="category" required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                </SelectContent>
              </Select>
              {state?.errors?.category && <p className="text-sm text-red-500">{state.errors.category}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <RadioGroup
                name="priority"
                defaultValue="Low"
                className="flex flex-col sm:flex-row sm:h-10 sm:items-center gap-3 sm:gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Low" id="priority-low" />
                  <Label htmlFor="priority-low">Low</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Medium" id="priority-medium" />
                  <Label htmlFor="priority-medium">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="High" id="priority-high" />
                  <Label htmlFor="priority-high">High</Label>
                </div>
              </RadioGroup>
              {state?.errors?.priority && <p className="text-sm text-red-500">{state.errors.priority}</p>}
            </div>
          </div>
          {state?.message && (
            <p className={`text-sm ${state.success ? "text-green-500" : "text-red-500"}`}>{state.message}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Submitting..." : "Submit Complaint"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
