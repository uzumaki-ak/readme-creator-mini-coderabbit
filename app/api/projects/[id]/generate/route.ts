import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createEuronStreamingCompletion } from "@/lib/euron"

// Increase timeout for this route
export const maxDuration = 60 // 60 seconds for Vercel Hobby
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get project with timeout
    const projectPromise = supabase.from("projects").select("*").eq("id", id).single()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Database query timeout")), 10000)
    )

    const { data: project, error: projectError } = await Promise.race([
      projectPromise,
      timeoutPromise
    ]) as any

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Verify ownership
    if (project.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get project files with limit
    const { data: files } = await supabase
      .from("project_files")
      .select("file_path, content, file_type")
      .eq("project_id", id)
      .limit(30) // Limit to 30 files

    // Build smarter context for AI
    console.log(`📁 Building context from ${files?.length || 0} files`)
    
    let fileContext = ""
    let totalChars = 0
    const maxTotalChars = 20000 // Limit total context
    
    if (files && files.length > 0) {
      // Prioritize important files
      const importantFiles = files.sort((a, b) => {
        const getPriority = (path: string) => {
          if (path.includes('package.json')) return 100
          if (path.includes('README')) return 90
          if (path.includes('src/') || path.includes('/src/')) return 80
          if (path.includes('app/') || path.includes('/app/')) return 70
          if (path.includes('components/')) return 60
          return 10
        }
        return getPriority(b.file_path) - getPriority(a.file_path)
      })
      
      for (const file of importantFiles) {
        if (totalChars >= maxTotalChars) break
        
        const truncatedContent = file.content?.slice(0, 2000) || ""
        const fileInfo = `--- ${file.file_path} ---\n${truncatedContent}\n\n`
        
        if (totalChars + fileInfo.length <= maxTotalChars) {
          fileContext += fileInfo
          totalChars += fileInfo.length
        }
      }
    }

    const fileStructure = project.file_structure ? 
      JSON.stringify(project.file_structure, null, 2).slice(0, 3000) : ""

    // Extract GitHub info from source
    let githubInfo = ""
    let owner = ""
    let repo = ""
    if (project.source && project.source.includes('GitHub:')) {
      const githubMatch = project.source.match(/GitHub:\s*([^\/]+\/[^)]+)/)
      if (githubMatch) {
        const githubParts = githubMatch[1].split('/')
        owner = githubParts[0] || ""
        repo = githubParts[1] || ""
        githubInfo = `\n\nGitHub Repository: https://github.com/${owner}/${repo}
GitHub Issues: https://github.com/${owner}/${repo}/issues
GitHub Discussions: https://github.com/${owner}/${repo}/discussions
Contribute: https://github.com/${owner}/${repo}/contribute`
      }
    }

    // Check for package.json for project info
    let packageJsonInfo = ""
    const packageJson = files?.find(f => f.file_path.includes('package.json'))
    if (packageJson?.content) {
      try {
        const pkg = JSON.parse(packageJson.content)
        // Use the extracted repo name from GitHub or fallback to package.json name
        const repoName = repo || pkg.name || "Not specified"
        packageJsonInfo = `\n\nPackage Info:
- Name: ${pkg.name || repoName || "Not specified"}
- Version: ${pkg.version || "Not specified"}
- Description: ${pkg.description || "Not specified"}
- Main Entry: ${pkg.main || "Not specified"}
- Scripts: ${pkg.scripts ? Object.keys(pkg.scripts).join(", ") : "None"}
- Dependencies: ${pkg.dependencies ? Object.keys(pkg.dependencies).length : 0}
- Dev Dependencies: ${pkg.devDependencies ? Object.keys(pkg.devDependencies).length : 0}`
      } catch (e) {
        console.log("Could not parse package.json")
      }
    }

    const prompt = `You are a senior developer creating a PROFESSIONAL, DETAILED README.md for the project "${project.name}". You must analyze the actual project code and structure, not just provide generic templates.
${project.description ? `Description: ${project.description}` : ""}
${packageJsonInfo}
Key Files Content:
${fileContext}
${githubInfo}
**PROJECT ANALYSIS TASK:**
1.  **TECH STACK ANALYSIS:** Read the package.json, config files (next.config.js, tailwind.config.js), and component files. List EXACT versions and SPECIFIC libraries found (e.g., "Next.js 14.2.16", "Radix UI Accordion", "Framer Motion 11.0.0").
2.  **ARCHITECTURE REVIEW:** Analyze the file structure in /app, /components, /lib, etc. Describe the routing strategy, component organization, and data flow.
3.  **FEATURE EXTRACTION:** From the actual code, extract specific features like authentication flows (Clerk setup), data visualization (Recharts usage), state management patterns, API routes, and UI patterns.
4.  **CONFIGURATION DETAILS:** Find and explain environment variables, build configuration, and deployment setup from the code.

**READMESECTION REQUIREMENTS (BE SPECIFIC):**
- **Title & Badges:** Generate accurate badges based on actual tech stack found.
- **Introduction:** Write 2-3 paragraphs explaining what this specific project does based on its code.
- **Features:** Bullet-point list of ACTUAL features found in code (e.g., "JWT authentication with refresh tokens", "Real-time dashboard with WebSocket updates").
- **Tech Stack:** Detailed table with library names, purposes, and version numbers if found.
- **Installation:** PRECISE clone commands. If project source is from GitHub (owner: "${owner}", repo: "${repo}"), use: \`git clone https://github.com/${owner}/${repo}.git\`. If from ZIP, use placeholder: \`git clone <repository-url>\` and note source was uploaded ZIP.
- **Configuration:** Specific environment variables needed from .env.example or code inspection.
- **Project Structure:** Detailed tree of key directories with explanations of each folder's purpose.
- **API Reference:** If API routes exist, document endpoints, methods, and examples.
- **License:** Default to MIT if no license found.

**IMPORTANT:** Base EVERY section on actual code analysis. If something isn't in the code, don't invent it. Be technical, thorough, and professional

IMPORTANT: Generate a FULL, COMPLETE README 
1. 🏷️ Title with badge (based on tech stack from files)
2. 📖 Description/Introduction
3. ✨ Features (infer from code structure)
4. 🛠️ Tech Stack (list technologies found in files)
5. 🚀 Quick Start / Installation
6. 📁 Project Structure (brief overview)
7. 🔧 Configuration (if config files exist)
8. 🤝 Contributing (include GitHub links if available)
9. 📄 License (add MIT or appropriate license)
10. 🙏 Acknowledgments.
Make it engaging, well-formatted with proper Markdown. Be SPECIFIC about this project, not generic`;

    console.log(`🤖 Generating README with prompt length: ${prompt.length} chars`)
    
    let response
    try {
      response = await createEuronStreamingCompletion({
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
        temperature: 0.7,
      })
    } catch (error) {
      console.error("Euron API error:", error)
      // Create basic README as fallback
      const basicReadme = `# ${project.name}

${project.description ? `## Description\n${project.description}\n` : ''}

${githubInfo ? `## GitHub\n${githubInfo}\n` : ''}

## Project Structure
This project contains ${files?.length || 0} files.

${files && files.length > 0 ? `### Key Files:\n${files.slice(0, 10).map(f => `- \`${f.file_path}\``).join('\n')}\n` : ''}

## Setup
1. Clone the repository${owner && repo ? `: \`git clone https://github.com/${owner}/${repo}\`` : ''}
2. Install dependencies: \`npm install\`
3. Start development server: \`npm run dev\`

---

*Note: AI-generated README was interrupted. Please edit this README manually with your project details.*`

      await supabase
        .from("projects")
        .update({ 
          generated_readme: basicReadme, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", id)

      return NextResponse.json({ 
        success: true,
        fallback: true,
        message: "Generated basic README due to AI timeout"
      })
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("No response body")
    }

    // Parse SSE and collect chunks with timeout
    const chunks: string[] = []
    const decoder = new TextDecoder()
    let buffer = ""
    let timeout = false

    // Set a timeout for the entire stream
    const streamTimeout = setTimeout(() => {
      timeout = true
      console.log("Stream timeout - closing early")
    }, 45000) // 45 second timeout for stream

    const stream = new ReadableStream({
      async pull(controller) {
        if (timeout) {
          controller.close()
          clearTimeout(streamTimeout)
          return
        }

        const { done, value } = await reader.read()

        if (done) {
          clearTimeout(streamTimeout)
          const fullReadme = chunks.join("")
          console.log(`✅ README generated: ${fullReadme.length} chars`)
          
          await supabase
            .from("projects")
            .update({ generated_readme: fullReadme, updated_at: new Date().toISOString() })
            .eq("id", id)
          
          controller.close()
          return
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()

            if (data === "[DONE]") {
              clearTimeout(streamTimeout)
              const fullReadme = chunks.join("")
              
              await supabase
                .from("projects")
                .update({ generated_readme: fullReadme, updated_at: new Date().toISOString() })
                .eq("id", id)
              
              controller.close()
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                chunks.push(content)
                controller.enqueue(new TextEncoder().encode(content))
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      },
      cancel() {
        clearTimeout(streamTimeout)
        reader.cancel()
      }
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error) {
    console.error("Generation error:", error)
    return NextResponse.json({ error: "Failed to generate README" }, { status: 500 })
  }
}