import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createEuronStreamingCompletion } from "@/lib/euron"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: project } = await supabase.from("projects").select("user_id").eq("id", id).single()

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { data: messages } = await supabase
      .from("chat_messages")
      .select("id, role, content")
      .eq("project_id", id)
      .order("created_at", { ascending: true })

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error("Chat fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

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

    const { message } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const { data: project, error: projectError } = await supabase.from("projects").select("*").eq("id", id).single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { data: files } = await supabase.from("project_files").select("file_path, content").eq("project_id", id)

    const { data: chatHistory } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("project_id", id)
      .order("created_at", { ascending: true })
      .limit(20)

    await supabase.from("chat_messages").insert({
      project_id: id,
      role: "user",
      content: message,
    })

    // Try Euron API first
    let useGemini = false
    let response
    
    try {
      const fileContext =
        files
          ?.slice(0, 15)
          .map((f) => `--- ${f.file_path} ---\n${f.content?.slice(0, 1500) || ""}`)
          .join("\n\n") || ""

      const systemPrompt = `You are a helpful AI assistant for a code project called "${project.name}".
${project.description ? `Project description: ${project.description}` : ""}

You have access to project files and can help with:
- Explaining code and project structure
- Answering questions about the codebase
- Suggesting improvements

IMPORTANT: Keep responses concise. Focus on the specific question.
If you don't know, say so. Don't make up information.

Project files:
${fileContext}

${project.generated_readme ? `Current README:\n${project.generated_readme}\n\n` : ""}

Respond in 2-3 paragraphs maximum. Use Markdown for code snippets.`

      const messages_array = [
        { role: "system" as const, content: systemPrompt },
        ...(chatHistory?.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })) || []),
        { role: "user" as const, content: message },
      ]

      response = await createEuronStreamingCompletion({
        messages: messages_array,
        max_tokens: 1500,
        temperature: 0.7,
      })
    } catch (error) {
      console.log("Euron failed, trying Gemini...")
      useGemini = true
    }

    // If Euron failed, try Gemini
    if (useGemini) {
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY
      
      if (!GEMINI_API_KEY) {
        // No Gemini key, return fallback
        const fallbackResponse = `I'm having trouble accessing the AI service right now. Here's what I can tell you from your project:

**Project Name:** ${project.name}
**Files:** ${files?.length || 0} files
**File Types:** ${[...new Set(files?.map(f => f.file_path.split('.').pop() || '') || [])].filter(Boolean).join(', ')}

Try asking specific questions like:
• "Where is the main component?"
• "Show me configuration files"
• "Find files with API endpoints"

You can also try:
1. Using the README generation feature
2. Checking the file viewer for code analysis
3. Try again tomorrow`

        await supabase.from("chat_messages").insert({
          project_id: id,
          role: "assistant",
          content: fallbackResponse,
        })

        return NextResponse.json({ 
          success: true,
          fallback: true,
          message: fallbackResponse 
        })
      }

      try {
        // Try Gemini 1.5 Flash (free)
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `You are a helpful AI assistant. The user asked: "${message}" about their project "${project.name}". ${project.description ? `Project description: ${project.description}` : ''}. Respond helpfully and concisely.` }]
            }],
            generationConfig: {
              maxOutputTokens: 1500,
              temperature: 0.7,
            }
          })
        })

        if (!geminiResponse.ok) {
          throw new Error(`Gemini API error: ${geminiResponse.status}`)
        }

        const data = await geminiResponse.json()
        const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response."

        await supabase.from("chat_messages").insert({
          project_id: id,
          role: "assistant",
          content: geminiText,
        })

        return NextResponse.json({ 
          success: true,
          gemini: true,
          message: geminiText 
        })
      } catch (geminiError) {
        console.error("Gemini also failed:", geminiError)
        
        // Both APIs failed
        const fallbackResponse = `I'm having trouble accessing the AI service right now. Both Euron and Gemini APIs are unavailable.

**Project Info:**
- **Name:** ${project.name}
- **Files:** ${files?.length || 0}
- **Description:** ${project.description || "None"}

You can:
1. Try the README generator
2. Use file viewer for code analysis
3. Try again later`

        await supabase.from("chat_messages").insert({
          project_id: id,
          role: "assistant",
          content: fallbackResponse,
        })

        return NextResponse.json({ 
          success: true,
          fallback: true,
          message: fallbackResponse 
        })
      }
    }

    // If we got here, Euron succeeded
    const reader = response!.body?.getReader()
    if (!reader) {
      throw new Error("No response body")
    }

    const chunks: string[] = []
    const decoder = new TextDecoder()
    let buffer = ""

    const stream = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read()

        if (done) {
          const fullResponse = chunks.join("")
          await supabase.from("chat_messages").insert({
            project_id: id,
            role: "assistant",
            content: fullResponse,
          })
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
              const fullResponse = chunks.join("")
              await supabase.from("chat_messages").insert({
                project_id: id,
                role: "assistant",
                content: fullResponse,
              })
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
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}