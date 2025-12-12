"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Check, Download, FileText } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface ReadmeViewerProps {
  content: string | null
  isGenerating?: boolean
}

export function ReadmeViewer({ content, isGenerating }: ReadmeViewerProps) {
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<"preview" | "raw">("preview")

  const handleCopy = async () => {
    if (!content) return
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!content) return
    const blob = new Blob([content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "README.md"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!content && !isGenerating) {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No README generated yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Click the button above to generate your README.</p>
        </CardContent>
      </Card>
    )
  }

  if (isGenerating) {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full flex-col items-center justify-center py-12 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <h3 className="mt-4 text-lg font-medium">Generating README...</h3>
          <p className="mt-2 text-sm text-muted-foreground">AI is analyzing your code and creating documentation.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-col space-y-4 pb-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <CardTitle className="text-lg">Generated README</CardTitle>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex rounded-md border border-border">
            <Button
              variant={viewMode === "preview" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("preview")}
              className="rounded-r-none text-xs sm:text-sm"
            >
              Preview
            </Button>
            <Button
              variant={viewMode === "raw" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("raw")}
              className="rounded-l-none text-xs sm:text-sm"
            >
              Raw
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1 sm:flex-none">
              {copied ? (
                <>
                  <Check className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Copied</span>
                  <span className="sm:hidden">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Copy</span>
                  <span className="sm:hidden">Copy</span>
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} className="flex-1 sm:flex-none">
              <Download className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
              <span className="sm:hidden">DL</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {viewMode === "preview" ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || ""}</ReactMarkdown>
          </div>
        ) : (
          <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
            <code>{content}</code>
          </pre>
        )}
      </CardContent>
    </Card>
  )
}