import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createEuronStreamingCompletion } from "@/lib/euron"

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

    // Get project
    const { data: project, error: projectError } = await supabase.from("projects").select("*").eq("id", id).single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Verify ownership
    if (project.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get project files
    const { data: files } = await supabase
      .from("project_files")
      .select("file_path, content, file_type")
      .eq("project_id", id)

    // Build context for AI
    const fileContext =
      files
        ?.slice(0, 30)
        .map((f) => {
          const truncatedContent = f.content?.slice(0, 3000) || ""
          return `--- ${f.file_path} ---\n${truncatedContent}`
        })
        .join("\n\n") || ""

    const fileStructure = JSON.stringify(project.file_structure, null, 2)

    const prompt = `You are an expert technical writer. Analyze the following project and generate a comprehensive, professional README.md file.

Project Name: ${project.name}
${project.description ? `Description: ${project.description}` : ""}

File Structure:
${fileStructure}

Key Files:
${fileContext}

Generate a README.md that includes:
1. Project title with a brief tagline
2. Badges (if applicable based on the tech stack)
3. Overview/Introduction
4. Features (based on what you can infer from the code)
5. Tech Stack
6. Installation instructions
7. Usage examples
8. Project structure overview
9. Configuration (if .env files or config files are present)
10. API documentation (if API routes are present)
11. Contributing guidelines
12. License placeholder

Make the README engaging, well-formatted with proper Markdown syntax, and include code blocks where appropriate. Be specific about the actual project rather than generic.`

    const response = await createEuronStreamingCompletion({
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4000,
      temperature: 0.7,
    })

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("No response body")
    }

    // Parse SSE and collect chunks for saving
    const chunks: string[] = []
    const decoder = new TextDecoder()
    let buffer = ""

    const stream = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read()

        if (done) {
          // Save to database when done
          const fullReadme = chunks.join("")
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
