"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Clock } from "lucide-react"
import { FileText as FileTextIcon } from "lucide-react"
import Link from "next/link"
import type { Project } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ProjectListProps {
  projects: Project[]
}

export function ProjectList({ projects }: ProjectListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm("Are you sure you want to delete this project?")) return

    setDeletingId(projectId)
    const supabase = createClient()

    const { error } = await supabase.from("projects").delete().eq("id", projectId)

    if (!error) {
      router.refresh()
    }
    setDeletingId(null)
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <FileTextIcon className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">No projects yet</h3>
        <p className="mt-2 text-muted-foreground">Upload your first project to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
          <Card className="h-full transition-colors hover:border-primary/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="line-clamp-1 text-lg">{project.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => handleDelete(project.id, e)}
                  disabled={deletingId === project.id}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete project</span>
                </Button>
              </div>
              {project.description && <CardDescription className="line-clamp-2">{project.description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{new Date(project.created_at).toLocaleDateString()}</span>
              </div>
              <div className="mt-2">
                {project.generated_readme ? (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    README Generated
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    Pending
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}