"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload as UploadIcon, Loader2, X } from "lucide-react"
import { File as FileIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [projectName, setProjectName] = useState("")
  const [description, setDescription] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile && droppedFile.name.endsWith(".zip")) {
        setFile(droppedFile)
        if (!projectName) {
          setProjectName(droppedFile.name.replace(".zip", ""))
        }
        setError(null)
      } else {
        setError("Please upload a ZIP file")
      }
    },
    [projectName],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile && selectedFile.name.endsWith(".zip")) {
        setFile(selectedFile)
        if (!projectName) {
          setProjectName(selectedFile.name.replace(".zip", ""))
        }
        setError(null)
      } else {
        setError("Please upload a ZIP file")
      }
    },
    [projectName],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !projectName.trim()) {
      setError("Please provide a project name and upload a ZIP file")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("name", projectName.trim())
      formData.append("description", description.trim())

      const response = await fetch("/api/projects/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      router.push(`/dashboard/projects/${data.projectId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Awesome Project"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your project..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Project Files</Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                file && "border-primary bg-primary/5",
              )}
            >
              <input
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              {file ? (
                <div className="flex flex-col items-center gap-2 text-center">
                  <FileIcon className="h-10 w-10 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                    className="mt-2"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <UploadIcon className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Drop your ZIP file here</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isUploading || !file}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading & Processing...
              </>
            ) : (
              <>
                <UploadIcon className="mr-2 h-4 w-4" />
                Upload & Generate README
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}