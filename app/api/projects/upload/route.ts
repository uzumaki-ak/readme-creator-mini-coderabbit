import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import JSZip from "jszip"
import type { FileNode } from "@/lib/types"
import { fetchGitHubRepo } from "@/lib/github"

const TEXT_EXTENSIONS = [
  ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".c", ".cpp", ".h", ".hpp",
  ".cs", ".go", ".rs", ".rb", ".php", ".swift", ".kt", ".scala", ".vue",
  ".svelte", ".html", ".css", ".scss", ".sass", ".less", ".json", ".xml",
  ".yaml", ".yml", ".md", ".txt", ".sh", ".bash", ".zsh", ".fish",
  ".dockerfile", ".gitignore", ".env.example", ".toml", ".ini", ".cfg",
  ".sql", ".graphql", ".prisma", ".proto",
]

const IGNORED_PATTERNS = [
  "node_modules/", ".git/", "__pycache__/", ".next/", "dist/", "build/",
  ".venv/", "venv/", ".DS_Store", "*.min.js", "*.min.css",
]

const IGNORED_FILES = [
  ".env", ".env.local", ".env.production", "package-lock.json",
  "yarn.lock", "pnpm-lock.yaml",
]

function shouldIgnore(path: string): boolean {
  const filename = path.split('/').pop() || ''
  
  // Check for ignored files by exact name
  if (IGNORED_FILES.includes(filename)) {
    return true
  }
  
  // Check for ignored patterns
  return IGNORED_PATTERNS.some((pattern) => {
    if (pattern.endsWith("/")) {
      return path.includes(pattern)
    }
    if (pattern.startsWith("*.")) {
      const ext = pattern.slice(1)
      return filename.endsWith(ext)
    }
    return false
  })
}

function isTextFile(filename: string): boolean {
  const lower = filename.toLowerCase()
  return (
    TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext)) ||
    lower === "dockerfile" ||
    lower === "makefile" ||
    lower === "readme" ||
    lower === "readme.md" ||
    lower === "license" ||
    lower === "license.md" ||
    lower === "package.json"
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

function extractRootFolder(paths: string[]): string | null {
  if (paths.length === 0) return null
  
  const firstComponents = paths
    .filter(p => p.includes('/'))
    .map(p => p.split('/')[0])
  
  if (firstComponents.length === 0) return null
  
  const uniqueRoots = [...new Set(firstComponents)]
  if (uniqueRoots.length === 1 && paths.some(p => p.includes('/'))) {
    return uniqueRoots[0] + '/'
  }
  
  return null
}

async function processZipFile(file: File): Promise<{
  files: Array<{ path: string; content: string }>
  fileStructure: FileNode[]
}> {
  console.log("📦 Processing ZIP file:", file.name, file.size)
  
  const arrayBuffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)

  const files: Array<{ path: string; content: string }> = []
  const allPaths: string[] = []

  const zipPaths = Object.entries(zip.files)
    .filter(([path, entry]) => !entry.dir)
    .map(([path]) => path)
  
  const commonRoot = extractRootFolder(zipPaths)

  console.log("📁 Total files in ZIP:", zipPaths.length)
  console.log("🏠 Common root folder:", commonRoot)

  // Extract files
  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue
    
    if (shouldIgnore(relativePath)) {
      continue
    }

    let normalizedPath = relativePath
    if (commonRoot && relativePath.startsWith(commonRoot)) {
      normalizedPath = relativePath.substring(commonRoot.length)
    }

    if (!normalizedPath) {
      continue
    }

    if (shouldIgnore(normalizedPath)) {
      continue
    }

    allPaths.push(normalizedPath)

    if (isTextFile(normalizedPath)) {
      try {
        const content = await zipEntry.async("string")
        if (content.length <= 100000) {
          files.push({ path: normalizedPath, content })
        }
      } catch (error) {
        console.log("Error reading file:", normalizedPath, error)
      }
    }
  }

  console.log("✅ Extracted files:", files.length)
  const fileStructure = buildFileTree(allPaths)
  
  return { files, fileStructure }
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
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const source = formData.get("source") as string
    const githubToken = formData.get("githubToken") as string

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    let files: Array<{ path: string; content: string }> = []
    let fileStructure: FileNode[] = []
    let sourceInfo = ""

    if (source === "zip") {
      // Handle ZIP upload
      const file = formData.get("file") as File
      
      if (!file) {
        return NextResponse.json({ error: "ZIP file is required" }, { status: 400 })
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
      }

      const result = await processZipFile(file)
      files = result.files
      fileStructure = result.fileStructure
      sourceInfo = `ZIP: ${file.name}`
      
    } else if (source === "github") {
  // Handle GitHub clone
  const githubUrl = formData.get("githubUrl") as string
  
  if (!githubUrl) {
    return NextResponse.json({ error: "GitHub URL is required" }, { status: 400 })
  }

  // Parse GitHub URL - FIXED PARSING
  let cleanUrl = githubUrl.trim()
  
  // Remove everything before github.com
  const githubMatch = cleanUrl.match(/github\.com\/([^\/]+\/[^\/\s]+)/)
  if (githubMatch) {
    cleanUrl = githubMatch[1]
  }
  
  // Remove .git suffix and trailing slash
  cleanUrl = cleanUrl.replace(/\.git$/, '').replace(/\/$/, '')
  
  // Now split by /
  const parts = cleanUrl.split('/')
  console.log(`🔍 Parsed GitHub URL: ${cleanUrl}, parts:`, parts)
  
  if (parts.length !== 2) {
    return NextResponse.json({ 
      error: `Invalid GitHub URL format. Use: username/repo or https://github.com/username/repo\nReceived: ${githubUrl}\nParsed: ${cleanUrl}` 
    }, { status: 400 })
  }

  const [owner, repo] = parts
  
  console.log(`✅ Extracted: owner=${owner}, repo=${repo}`)
  
  

      
      try {
        console.log(`🌐 Cloning GitHub repo: ${owner}/${repo}`)
        
        // Create a temporary environment with the user's token
        const originalToken = process.env.GITHUB_TOKEN
        if (githubToken) {
          // Use user-provided token for this request only
          process.env.GITHUB_TOKEN = githubToken
          console.log("🔑 Using user-provided GitHub token")
        }
        
        const result = await fetchGitHubRepo(owner, repo)
        files = result.files
        
        // Restore original token
        if (githubToken) {
          process.env.GITHUB_TOKEN = originalToken
        }
        
        if (files.length === 0) {
          return NextResponse.json({ 
            error: `No text files could be fetched from the repository. Found ${result.fileCount} total files but none were text-based.`
          }, { status: 400 })
        }
        
        console.log(`✅ GitHub clone successful: ${files.length} text files fetched out of ${result.fileCount} total files`)
        
        // Log the files we got
        files.forEach((file, idx) => {
          console.log(`  ${idx + 1}. ${file.path} (${file.content.length} chars)`)
        })
        
        // Build file structure from GitHub paths
        const allPaths = files.map(f => f.path)
        fileStructure = buildFileTree(allPaths)
        sourceInfo = `GitHub: ${owner}/${repo} (${files.length} files)`
        
      } catch (error) {
        console.error("❌ GitHub clone failed:", error)
        
        let errorMessage = `Failed to fetch GitHub repository. `
        
        if (error instanceof Error) {
          if (error.message.includes('rate limit')) {
            errorMessage += `GitHub API rate limit exceeded. `
            if (!githubToken && !process.env.GITHUB_TOKEN) {
              errorMessage += `Add a GitHub token for higher limits.`
            } else {
              errorMessage += `Try again later or use a different token.`
            }
          } else if (error.message.includes('not found')) {
            errorMessage += `Repository not found. It might be private - add a GitHub token to access it.`
          } else {
            errorMessage += error.message
          }
        } else {
          errorMessage += 'Unknown error occurred.'
        }
        
        return NextResponse.json({ error: errorMessage }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: "Invalid source type" }, { status: 400 })
    }

    // Create project in database
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        file_structure: fileStructure,
        source: sourceInfo,
      })
      .select()
      .single()

    if (projectError) {
      console.error("Project creation error:", projectError)
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

      console.log("Inserting", fileRecords.length, "files into database")
      const { error: filesError } = await supabase.from("project_files").insert(fileRecords)

      if (filesError) {
        console.error("Error inserting files:", filesError)
      }
    }

    return NextResponse.json({ 
      projectId: project.id,
      totalFiles: files.length,
      source: sourceInfo
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 })
  }
}