import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/header"
import { FileUpload } from "@/components/dashboard/file-upload"
import { ProjectList } from "@/components/dashboard/project-list"
import type { Project } from "@/lib/types"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-svh bg-background">
      <DashboardHeader user={user} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Upload a project to generate a README, or manage your existing projects.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h2 className="mb-4 text-lg font-semibold">New Project</h2>
            <FileUpload />
          </div>
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold">Your Projects</h2>
            <ProjectList projects={(projects as Project[]) || []} />
          </div>
        </div>
      </main>
    </div>
  )
}
