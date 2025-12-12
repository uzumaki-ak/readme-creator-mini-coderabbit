"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, MessageSquare, Code, Monitor, Smartphone } from "lucide-react"
import { File as FileIcon } from "lucide-react"
import { useState, useEffect } from "react"
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
  const [isMobile, setIsMobile] = useState(false)
  const [showDesktopMessage, setShowDesktopMessage] = useState(false)
  
  const filename = path.split("/").pop() || path
  const extension = filename.split(".").pop()?.toLowerCase()

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setShowDesktopMessage(mobile)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  // If on mobile and showing desktop message
  if (isMobile && showDesktopMessage) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-0 sm:p-6 sm:pb-3">
          <div className="flex items-center gap-2">
            <FileIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <CardTitle className="text-base sm:text-lg truncate">{filename}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 sm:h-9 sm:w-9">
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </CardHeader>
        
        <CardContent className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="mb-6 rounded-full bg-muted p-4">
            <Smartphone className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-medium">File Viewer Not Optimized for Mobile</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            For the best experience viewing and analyzing code, please switch to desktop mode or use a larger screen.
          </p>
          <div className="mb-4 rounded-lg border bg-muted/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Desktop Mode Instructions:</h4>
            </div>
            <ul className="space-y-2 text-left text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-medium">
                  1
                </span>
                <span>Rotate your device to landscape orientation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-medium">
                  2
                </span>
                <span>Enable "Desktop site" in your browser settings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-medium">
                  3
                </span>
                <span>Refresh the page to apply changes</span>
              </li>
            </ul>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDesktopMessage(false)}>
              Try Anyway
            </Button>
            <Button onClick={onClose}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Normal desktop view
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-0 sm:p-6 sm:pb-3">
        <div className="flex items-center gap-2">
          <FileIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          <CardTitle className="text-base sm:text-lg truncate">{filename}</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 sm:h-9 sm:w-9">
          <X className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-3 pb-0 sm:px-6">
            <TabsList className="w-full">
              <TabsTrigger value="content" className="flex-1 gap-1 sm:gap-2 text-xs sm:text-sm">
                <FileIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Content</span>
                <span className="sm:hidden">View</span>
              </TabsTrigger>
              <TabsTrigger 
                value="chat" 
                className="flex-1 gap-1 sm:gap-2 text-xs sm:text-sm"
                disabled={!projectId || !content}
              >
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Code Chat</span>
                <span className="sm:hidden">Chat</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-hidden px-3 py-2 sm:px-6 sm:py-4">
            <TabsContent value="content" className="h-full m-0">
              <div className="h-full overflow-hidden rounded-lg border bg-muted/50">
                {content ? (
                  <SyntaxHighlighter
                    language={language}
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      padding: '0.75rem',
                      background: 'transparent',
                      fontSize: '0.75rem',
                      height: '100%',
                      overflow: 'auto'
                    }}
                    showLineNumbers
                    wrapLines
                    codeTagProps={{
                      style: {
                        fontSize: '0.75rem',
                        lineHeight: '1.5',
                      }
                    }}
                  >
                    {content}
                  </SyntaxHighlighter>
                ) : (
                  <div className="flex h-full items-center justify-center p-4 sm:p-8">
                    <p className="text-xs sm:text-sm text-muted-foreground">No content available for this file</p>
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
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-4">
                  <div className="text-center">
                    <Code className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
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