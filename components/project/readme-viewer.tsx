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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Generated README</CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border">
            <Button
              variant={viewMode === "preview" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("preview")}
              className="rounded-r-none"
            >
              Preview
            </Button>
            <Button
              variant={viewMode === "raw" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("raw")}
              className="rounded-l-none"
            >
              Raw
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-1 h-4 w-4" />
            Download
          </Button>
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
