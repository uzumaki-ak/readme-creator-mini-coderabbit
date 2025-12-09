import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { analyzeCodeLocally, generateLocalAnalysisReport } from "@/lib/local-analyzer"

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

    const { message, filePath, fileContent } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (!filePath || !fileContent) {
      return NextResponse.json({ error: "File path and content are required" }, { status: 400 })
    }

    const { data: project, error: projectError } = await supabase.from("projects").select("*").eq("id", id).single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const filename = filePath.split("/").pop() || filePath
    const extension = filename.split(".").pop()?.toLowerCase() || ""

    // Get language for syntax highlighting
    const getLanguage = (ext: string): string => {
      const map: Record<string, string> = {
        js: "JavaScript", ts: "TypeScript", py: "Python", rb: "Ruby", go: "Go",
        rs: "Rust", java: "Java", cpp: "C++", c: "C", cs: "C#", php: "PHP",
        swift: "Swift", kt: "Kotlin", scala: "Scala", html: "HTML", css: "CSS",
        scss: "SCSS", sass: "Sass", less: "Less", json: "JSON", xml: "XML",
        yaml: "YAML", yml: "YAML", md: "Markdown", sql: "SQL", graphql: "GraphQL",
        prisma: "Prisma", proto: "Protocol Buffers", sh: "Shell", bash: "Bash",
        zsh: "Bash", fish: "Bash", dockerfile: "Dockerfile", gitignore: "Gitignore",
        env: "Environment Variables", toml: "TOML", ini: "INI", cfg: "Configuration",
      }
      return map[ext] || ext.toUpperCase()
    }

    const language = getLanguage(extension)

    // Try AI APIs if configured
    let aiResponse = null
    
    // Check if we have API keys
    const hasEuronKey = !!process.env.EURON_API_KEY && process.env.EURON_API_KEY.startsWith('sk-')
    const hasGeminiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith('AIza')
    
    if (hasEuronKey) {
      try {
        const { createEuronCompletion } = await import("@/lib/euron")
        
        const systemPrompt = `You are analyzing ${filename} (${language}) from project "${project.name}".
Analyze the code for security, performance, best practices, and suggest improvements.`
        
        const response = await createEuronCompletion({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `${message}\n\nFile content:\n\`\`\`${language}\n${fileContent.substring(0, 8000)}\n\`\`\`` }
          ],
          max_tokens: 2000,
          temperature: 0.7,
          stream: false
        })

        const data = await response.json()
        aiResponse = data.choices?.[0]?.message?.content || null
      } catch (error) {
        console.log("Euron failed, trying Gemini...")
      }
    }
    
    if (!aiResponse && hasGeminiKey) {
      try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ 
                text: `Analyze this ${language} code for ${message}:\n\n${fileContent.substring(0, 8000)}` 
              }]
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
        }
      } catch (error) {
        console.log("Gemini failed, using local analysis...")
      }
    }

    // If AI didn't respond, use local analysis
    if (!aiResponse) {
      const issues = analyzeCodeLocally(fileContent, language, filename)
      aiResponse = generateLocalAnalysisReport(issues, filename, language)
      
      // Add context about API setup
      aiResponse += `\n\n## 🔧 AI Analysis Setup\n`
      
      if (!hasEuronKey && !hasGeminiKey) {
        aiResponse += `To enable AI-powered code analysis:\n`
        aiResponse += `1. Get a free Gemini key from https://aistudio.google.com/app/apikey\n`
        aiResponse += `2. Add GEMINI_API_KEY to your .env.local file\n`
      } else if (!hasEuronKey) {
        aiResponse += `Euron API key not configured or invalid.\n`
      } else if (!hasGeminiKey) {
        aiResponse += `Gemini API key not configured.\n`
      }
      
      aiResponse += `\n**Current AI Status:** ${hasEuronKey ? '✅ Euron' : '❌ Euron'} | ${hasGeminiKey ? '✅ Gemini' : '❌ Gemini'}`
    }

    return NextResponse.json({ 
      success: true,
      message: aiResponse,
      localAnalysis: !hasEuronKey && !hasGeminiKey
    })
  } catch (error) {
    console.error("File chat error:", error)
    return NextResponse.json({ 
      error: "Failed to analyze file",
      fallback: true 
    }, { status: 500 })
  }
}