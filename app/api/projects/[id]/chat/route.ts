import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { searchFiles } from "@/lib/search"
import type { EuronMessage } from "@/lib/euron"

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

function extractFileName(query: string): string | null {
  // Look for patterns like "types.ts", "file.ts", etc.
  const filePattern = /\b(\w+\.\w{1,10})\b/g
  const matches = query.match(filePattern)
  return matches ? matches[0] : null
}

function getLocalAnswer(files: Array<{file_path: string, content: string}>, query: string): string {
  // First try to extract a specific file name
  const fileName = extractFileName(query)
  
  if (fileName) {
    // Look for exact file name match
    const exactMatches = files.filter(f => {
      const justFileName = f.file_path.split('/').pop()
      return justFileName?.toLowerCase() === fileName.toLowerCase()
    })
    
    if (exactMatches.length > 0) {
      let answer = `**📁 Found ${exactMatches.length} file(s) named "${fileName}":**\n\n`
      exactMatches.forEach(match => {
        answer += `• **${match.file_path}**\n`
        const lines = match.content.split('\n').slice(0, 3)
        if (lines.some(line => line.trim())) {
          answer += `  \`\`\`\n  ${lines.join('\n  ').substring(0, 100)}...\n  \`\`\`\n`
        }
      })
      return answer
    }
  }
  
  // If no specific file name, do a general search
  const searchResults = searchFiles(files, query)
  
  if (searchResults.length === 0) {
    const fileTypes = [...new Set(files.map(f => f.file_path.split('.').pop() || '').filter(Boolean))]
    return `**No files found matching "${query}"**\n\nTry asking more specifically:\n• "Find all TypeScript files"\n• "Show me configuration files"\n• "List all components"\n\n**Available file types:** ${fileTypes.join(', ')}`
  }
  
  let answer = `**🔍 Search results for "${query}":**\n\n`
  
  for (const result of searchResults.slice(0, 5)) {
    answer += `**📄 ${result.file_path}** (relevance: ${result.relevance})\n`
    if (result.matches.length > 0) {
      answer += `*Matches:* ${result.matches.slice(0, 2).join(', ')}\n`
    }
    const preview = result.content.split('\n').slice(0, 3).join('\n').substring(0, 150)
    if (preview.trim()) {
      answer += `\`\`\`\n${preview}...\n\`\`\`\n\n`
    }
  }
  
  if (searchResults.length > 5) {
    answer += `*...and ${searchResults.length - 5} more files*\n`
  }
  
  return answer
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
      .limit(10)

    await supabase.from("chat_messages").insert({
      project_id: id,
      role: "user",
      content: message,
    })

    // First, try to understand what type of question this is
    const questionLower = message.toLowerCase()
    const isFileLocationQuestion = 
      questionLower.includes('where is') ||
      questionLower.includes('find ') ||
      questionLower.includes('locate ') ||
      questionLower.includes('which file') ||
      questionLower.includes('show me ') ||
      questionLower.includes('search for')
    
    // If it's a file location question, try local search first
    if (isFileLocationQuestion && files && files.length > 0) {
      const localAnswer = getLocalAnswer(files, message)
      
      // Check if local answer is useful
      const hasUsefulResults = !localAnswer.includes('No files found') && 
                               !localAnswer.includes('Try asking')
      
      if (hasUsefulResults) {
        await supabase.from("chat_messages").insert({
          project_id: id,
          role: "assistant",
          content: localAnswer,
        })

        return NextResponse.json({ 
          success: true,
          local: true,
          message: localAnswer
        })
      }
      // If local search didn't find anything, continue to AI
    }

    // Prepare context for AI
    const fileContext = files
      ?.slice(0, 8) // Reduced context to save tokens
      .map((f) => {
        // Try to extract meaningful info from each file
        const lines = f.content.split('\n')
        let usefulContent = ''
        
        if (f.file_path.includes('types') || f.file_path.includes('interface') || f.file_path.includes('type')) {
          // For type files, get type definitions
          //@ts-ignore
          const typeLines = lines.filter(line => 
            line.includes('type ') || 
            line.includes('interface ') || 
            line.includes('export ')
          ).slice(0, 5)
          usefulContent = typeLines.join('\n')
        } else if (f.file_path.includes('component') || f.file_path.includes('tsx') || f.file_path.includes('jsx')) {
          // For components, get component definitions
          //@ts-ignore
          const componentLines = lines.filter(line => 
            line.includes('export default') || 
            line.includes('function ') || 
            line.includes('const ') && (line.includes('= () =>') || line.includes('= function'))
          ).slice(0, 3)
          usefulContent = componentLines.join('\n')
        } else {
          // For other files, just get first few lines
          usefulContent = lines.slice(0, 3).join('\n')
        }
        
        return `--- ${f.file_path} ---\n${usefulContent.substring(0, 800)}`
      })
      .join("\n\n") || ""

    const systemPrompt = `You are an expert developer helping with a project called "${project.name}".
${project.description ? `Project description: ${project.description}` : ""}

You have access to project files. The user asked: "${message}"

IMPORTANT RULES:
1. If the user asks about specific files or where something is, FIRST look in the provided file context
2. Be specific and accurate
3. If you're not sure, say so
4. Keep responses concise but helpful
5. Use Markdown for formatting

Project files context:
${fileContext}

${project.generated_readme ? `Current README summary:\n${project.generated_readme.substring(0, 500)}\n\n` : ""}

Now answer the user's question:`

    // Build messages array with proper typing
    const messages_array: EuronMessage[] = [
      { role: "system", content: systemPrompt },
    ]

    // Add chat history with proper typing
    if (chatHistory) {
      for (const m of chatHistory) {
        if (m.role === "user" || m.role === "assistant") {
          messages_array.push({
            role: m.role,
            content: m.content
          } as EuronMessage)
        }
      }
    }

    // Add current message
    messages_array.push({ role: "user", content: message })

    // Check API keys
    const hasEuronKey = !!process.env.EURON_API_KEY
    const hasGeminiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith('AIza')

    let aiResponse = null

    // Try Euron first (since it's specifically for this project)
    if (hasEuronKey) {
      try {
        const { createEuronCompletion } = await import("@/lib/euron")
        
        const response = await createEuronCompletion({
          messages: messages_array,
          max_tokens: 2000,
          temperature: 0.7,
          stream: false
        })

        const data = await response.json()
        aiResponse = data.choices?.[0]?.message?.content || null
        
        if (aiResponse) {
          console.log("✅ Euron response successful")
        }
      } catch (error) {
        console.log("Euron failed:", error instanceof Error ? error.message : "Unknown error")
      }
    }

    // Try Gemini if Euron failed or not configured
    if (!aiResponse && hasGeminiKey) {
      try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: systemPrompt }]
            }],
            generationConfig: {
              maxOutputTokens: 2000,
              temperature: 0.7,
            }
          })
        })

        if (geminiResponse.ok) {
          const data = await geminiResponse.json()
          aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || null
          console.log("✅ Gemini response successful")
        } else {
          console.log("Gemini response not OK:", await geminiResponse.text())
        }
      } catch (error) {
        console.log("Gemini failed:", error instanceof Error ? error.message : "Unknown error")
      }
    }

    // If AI didn't respond, provide intelligent fallback
    if (!aiResponse) {
      // Try to provide the best possible answer based on available info
      const fileList = files?.slice(0, 10).map(f => `• ${f.file_path}`).join('\n') || "No files available"
      const fileCount = files?.length || 0
      
      if (isFileLocationQuestion && files && files.length > 0) {
        // If it was a file location question, provide file list
        aiResponse = `I can't access AI services right now, but here are the files in your project:\n\n${fileList}\n\n**Total:** ${fileCount} files\n\nTry looking for specific files using the file viewer.`
      } else {
        aiResponse = `I'm having trouble accessing AI services. Here's what I know about your project:\n\n**Project:** ${project.name}\n**Files:** ${fileCount}\n\nFor file searches, try asking:\n• "Where is types.ts?"\n• "Find configuration files"\n• "Show me components"`
      }
    }

    await supabase.from("chat_messages").insert({
      project_id: id,
      role: "assistant",
      content: aiResponse,
    })

    return NextResponse.json({ 
      success: true,
      message: aiResponse,
      usedAI: !isFileLocationQuestion || aiResponse.includes('✅') || aiResponse.includes('found')
    })
  } catch (error) {
    console.error("Chat error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ 
      error: "Failed to process message",
      fallback: true 
    }, { status: 500 })
  }
}