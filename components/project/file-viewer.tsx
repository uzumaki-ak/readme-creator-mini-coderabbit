"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, MessageSquare, Code } from "lucide-react"
import { File as FileIcon } from "lucide-react"
import { useState } from "react"
import { FileChat } from "./file-chat"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface FileViewerProps {
  path: string
  content: string | null
  onClose: () => void
  projectId?: string
}

export function FileViewer({ path, content, onClose, projectId }: FileViewerProps) {
  const [activeTab, setActiveTab] = useState("content")
  const filename = path.split("/").pop() || path
  const extension = filename.split(".").pop()?.toLowerCase()

  const getLanguage = (ext: string | undefined): string => {
    const languageMap: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      rb: "ruby",
      go: "go",
      rs: "rust",
      java: "java",
      css: "css",
      html: "html",
      json: "json",
      yaml: "yaml",
      yml: "yaml",
      md: "markdown",
      sql: "sql",
      prisma: "prisma",
      graphql: "graphql",
      proto: "protobuf",
      sh: "bash",
      bash: "bash",
      zsh: "bash",
      fish: "bash",
      dockerfile: "dockerfile",
      gitignore: "gitignore",
      env: "dotenv",
      toml: "toml",
      ini: "ini",
      cfg: "ini",
    }
    return languageMap[ext || ""] || "plaintext"
  }

  const language = getLanguage(extension)

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <FileIcon className="h-5 w-5" />
          <CardTitle className="text-lg">{filename}</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-6 pb-0">
            <TabsList className="w-full">
              <TabsTrigger value="content" className="flex-1 gap-2">
                <FileIcon className="h-4 w-4" />
                Content
              </TabsTrigger>
              <TabsTrigger 
                value="chat" 
                className="flex-1 gap-2"
                disabled={!projectId || !content}
              >
                <MessageSquare className="h-4 w-4" />
                Code Chat
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-hidden px-6 py-4">
            <TabsContent value="content" className="h-full m-0">
              <div className="h-full overflow-hidden rounded-lg border bg-muted/50">
                {content ? (
                  <SyntaxHighlighter
                    language={language}
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      background: 'transparent',
                      fontSize: '0.875rem',
                      height: '100%',
                      overflow: 'auto'
                    }}
                    showLineNumbers
                    wrapLines
                  >
                    {content}
                  </SyntaxHighlighter>
                ) : (
                  <div className="flex h-full items-center justify-center p-8">
                    <p className="text-muted-foreground">No content available for this file</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="chat" className="h-full m-0">
              {projectId && content ? (
                <div className="h-full">
                  <FileChat 
                    projectId={projectId}
                    filePath={path}
                    fileContent={content}
                  />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed">
                  <div className="text-center">
                    <Code className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">
                      {!projectId 
                        ? "Project context unavailable" 
                        : !content 
                        ? "No file content to analyze"
                        : "Unable to start code chat"}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}