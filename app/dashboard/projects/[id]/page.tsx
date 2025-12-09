import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/header"
import { ProjectDetailClient } from "./project-detail-client"
import type { Project, ProjectFile } from "@/lib/types"

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: project, error } = await supabase.from("projects").select("*").eq("id", id).single()

  if (error || !project) {
    notFound()
  }

  // Verify ownership
  if (project.user_id !== user.id) {
    notFound()
  }

  const { data: files } = await supabase.from("project_files").select("*").eq("project_id", id)

  return (
    <div className="min-h-svh bg-background">
      <DashboardHeader user={user} />
      <ProjectDetailClient project={project as Project} files={(files as ProjectFile[]) || []} />
    </div>
  )
}
