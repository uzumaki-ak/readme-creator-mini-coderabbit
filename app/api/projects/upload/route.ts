import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import JSZip from "jszip"
import type { FileNode } from "@/lib/types"

const TEXT_EXTENSIONS = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".go",
  ".rs",
  ".rb",
  ".php",
  ".swift",
  ".kt",
  ".scala",
  ".vue",
  ".svelte",
  ".html",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".json",
  ".xml",
  ".yaml",
  ".yml",
  ".md",
  ".txt",
  ".sh",
  ".bash",
  ".zsh",
  ".fish",
  ".dockerfile",
  ".gitignore",
  ".env.example",
  ".toml",
  ".ini",
  ".cfg",
  ".sql",
  ".graphql",
  ".prisma",
  ".proto",
  
]

const IGNORED_PATTERNS = [
  "node_modules/",
  ".git/",
  "__pycache__/",
  ".next/",
  "dist/",
  "build/",
  ".venv/",
  "venv/",
  ".env",
  ".DS_Store",
  "*.lock",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "*.min.js",
  "*.min.css",
]

function shouldIgnore(path: string): boolean {
  return IGNORED_PATTERNS.some((pattern) => {
    if (pattern.endsWith("/")) {
      return path.includes(pattern)
    }
    if (pattern.startsWith("*.")) {
      return path.endsWith(pattern.slice(1))
    }
    return path.includes(pattern)
  })
}

function isTextFile(filename: string): boolean {
  const lower = filename.toLowerCase()
  return (
    TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext)) ||
    lower === "dockerfile" ||
    lower === "makefile" ||
    lower === "readme" ||
    lower === "license"
  )
}

function buildFileTree(paths: string[]): FileNode[] {
  const root: FileNode[] = []

  for (const path of paths) {
    const parts = path.split("/").filter(Boolean)
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]
      const isFile = i === parts.length - 1
      const currentPath = parts.slice(0, i + 1).join("/")

      let node = current.find((n) => n.name === name)

      if (!node) {
        node = {
          name,
          path: currentPath,
          type: isFile ? "file" : "directory",
          children: isFile ? undefined : [],
        }
        current.push(node)
      }

      if (!isFile && node.children) {
        current = node.children
      }
    }
  }

  return root
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const description = formData.get("description") as string

    if (!file || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Parse ZIP file
    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)

    const files: { path: string; content: string }[] = []
    const allPaths: string[] = []

    // Extract files
    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir || shouldIgnore(relativePath)) continue

      // Normalize path (remove leading folder if ZIP contains a single root folder)
      const normalizedPath = relativePath.includes("/")
        ? relativePath.split("/").slice(1).join("/") || relativePath
        : relativePath

      if (!normalizedPath) continue

      allPaths.push(normalizedPath)

      if (isTextFile(normalizedPath)) {
        try {
          const content = await zipEntry.async("string")
          // Limit file size to prevent huge files
          if (content.length <= 100000) {
            files.push({ path: normalizedPath, content })
          }
        } catch {
          // Skip binary or unreadable files
        }
      }
    }

    const fileStructure = buildFileTree(allPaths)

    // Create project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        file_structure: fileStructure,
      })
      .select()
      .single()

    if (projectError) {
      return NextResponse.json({ error: projectError.message }, { status: 500 })
    }

    // Insert files (batch insert)
    if (files.length > 0) {
      const fileRecords = files.map((f) => ({
        project_id: project.id,
        file_path: f.path,
        content: f.content,
        file_type: f.path.split(".").pop() || null,
      }))

      const { error: filesError } = await supabase.from("project_files").insert(fileRecords)

      if (filesError) {
        console.error("Error inserting files:", filesError)
      }
    }

    return NextResponse.json({ projectId: project.id })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 })
  }
}
