"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileTree } from "@/components/project/file-tree"
import { ReadmeViewer } from "@/components/project/readme-viewer"
import { FileViewer } from "@/components/project/file-viewer"
import { ProjectChat } from "@/components/project/project-chat"
import { ArrowLeft, Sparkles, FolderTree, MessageSquare, FileText, File as FileIcon } from "lucide-react"
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
    let receivedChunks = 0

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        receivedChunks++
        const chunk = decoder.decode(value)
        readme += chunk
        
        // Update progress every 5 chunks
        if (receivedChunks % 5 === 0) {
          setProject((prev) => ({ ...prev, generated_readme: readme }))
        }
      }
    }

    // Final update
    setProject((prev) => ({ ...prev, generated_readme: readme }))
    router.refresh()
    
  } catch (error) {
    console.error("Generation error:", error)
    alert("README generation took too long or failed. A basic README was created. Please edit it manually.")
  } finally {
    setIsGenerating(false)
  }
}

  return (
    <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <Link
            href="/dashboard"
            className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
          </Link>
          <h1 className="text-xl font-bold sm:text-2xl">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">{project.description}</p>
          )}
        </div>
        <Button onClick={handleGenerateReadme} disabled={isGenerating} className="w-full sm:w-auto">
          <Sparkles className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">
            {project.generated_readme ? "Regenerate README" : "Generate README"}
          </span>
          <span className="sm:hidden">
            {project.generated_readme ? "Regenerate" : "Generate"}
          </span>
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="readme" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto">
          <TabsTrigger value="readme" className="gap-1 sm:gap-2">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">README</span>
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-1 sm:gap-2">
            <FolderTree className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Files</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1 sm:gap-2">
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Chat</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="readme" className="min-h-[400px] sm:min-h-[600px]">
          <ReadmeViewer content={project.generated_readme} isGenerating={isGenerating} />
        </TabsContent>

        <TabsContent value="files" className="min-h-[400px] sm:min-h-[600px]">
          <div className="grid h-[400px] gap-4 sm:h-[600px] lg:grid-cols-4">
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
                  projectId={project.id}
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border">
                  <div className="text-center">
                    <FileIcon className="mx-auto h-8 w-8 text-muted-foreground sm:h-12 sm:w-12" />
                    <p className="mt-2 text-sm text-muted-foreground">Select a file to view and analyze</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="min-h-[400px] sm:min-h-[600px]">
          <ProjectChat projectId={project.id} />
        </TabsContent>
      </Tabs>
    </main>
  )
}