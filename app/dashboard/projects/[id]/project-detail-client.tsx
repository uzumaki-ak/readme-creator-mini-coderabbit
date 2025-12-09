"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileTree } from "@/components/project/file-tree"
import { ReadmeViewer } from "@/components/project/readme-viewer"
import { FileViewer } from "@/components/project/file-viewer"
import { ProjectChat } from "@/components/project/project-chat"
import { ArrowLeft, Sparkles, FolderTree, MessageSquare, FileText } from "lucide-react"
import { File as FileIcon } from "lucide-react"  // Add this import
import type { Project, ProjectFile, FileNode } from "@/lib/types"
import Link from "next/link"

interface ProjectDetailClientProps {
  project: Project
  files: ProjectFile[]
}

export function ProjectDetailClient({ project: initialProject, files }: ProjectDetailClientProps) {
  const router = useRouter()
  const [project, setProject] = useState(initialProject)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const selectedFileContent = files.find((f) => f.file_path === selectedFile)?.content || null

  const handleGenerateReadme = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/projects/${project.id}/generate`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to generate README")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let readme = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          readme += decoder.decode(value)
          setProject((prev) => ({ ...prev, generated_readme: readme }))
        }
      }

      router.refresh()
    } catch (error) {
      console.error("Generation error:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link
            href="/dashboard"
            className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && <p className="mt-1 text-muted-foreground">{project.description}</p>}
        </div>
        <Button onClick={handleGenerateReadme} disabled={isGenerating}>
          <Sparkles className="mr-2 h-4 w-4" />
          {project.generated_readme ? "Regenerate README" : "Generate README"}
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="readme" className="space-y-4">
        <TabsList>
          <TabsTrigger value="readme" className="gap-2">
            <FileText className="h-4 w-4" />
            README
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-2">
            <FolderTree className="h-4 w-4" />
            Files
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="readme" className="min-h-[600px]">
          <ReadmeViewer content={project.generated_readme} isGenerating={isGenerating} />
        </TabsContent>

        <TabsContent value="files" className="min-h-[600px]">
          <div className="grid h-[600px] gap-4 lg:grid-cols-4">
            <div className="overflow-auto rounded-lg border border-border bg-card p-2">
              <FileTree
                nodes={(project.file_structure as FileNode[]) || []}
                onFileSelect={setSelectedFile}
                selectedPath={selectedFile || undefined}
              />
            </div>
            <div className="lg:col-span-3">
              {selectedFile ? (
                <FileViewer 
                  path={selectedFile} 
                  content={selectedFileContent} 
                  onClose={() => setSelectedFile(null)}
                  projectId={project.id}  // Add this line
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border">
                  <div className="text-center">
                    <FileIcon className="mx-auto h-12 w-12 text-muted-foreground" /> {/* Fixed this line */}
                    <p className="mt-2 text-muted-foreground">Select a file to view and analyze</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="min-h-[600px]">
          <ProjectChat projectId={project.id} />
        </TabsContent>
      </Tabs>
    </main>
  )
}