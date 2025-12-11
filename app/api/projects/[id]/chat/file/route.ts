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
        prisma: "Prisma", proto: "Protobuf", sh: "Shell", bash: "Bash",
        zsh: "Bash", fish: "Bash", dockerfile: "Dockerfile", gitignore: "Gitignore",
        env: "Environment Variables", toml: "TOML", ini: "INI", cfg: "Configuration",
      }
      return map[ext] || ext.toUpperCase()
    }

    const language = getLanguage(extension)
    const questionLower = message.toLowerCase()

    // Check if this is an action request (add comments, refactor, etc.)
    const isActionRequest = 
      questionLower.includes('add comment') ||
      questionLower.includes('add comments') ||
      questionLower.includes('comment') ||
      questionLower.includes('explain this') ||
      questionLower.includes('show me') ||
      questionLower.includes('what does this do')

    // Check API keys
    const hasEuronKey = !!process.env.EURON_API_KEY
    const hasGeminiKey = !!process.env.GEMINI_API_KEY
    
    console.log(`🔑 API Key Status: Euron=${hasEuronKey ? 'Yes' : 'No'}, Gemini=${hasGeminiKey ? 'Yes' : 'No'}`)
    console.log(`📄 File: ${filename} (${language}), Size: ${fileContent.length} chars`)
    console.log(`❓ Question: ${message}`)
    
    let aiResponse = null

    // TRY GEMINI FIRST (FREE) - Use correct model
    if (hasGeminiKey) {
      console.log("🔄 Trying Gemini API...")
      
      // Build specific prompt based on request type
      let geminiPrompt = ""
      
      if (questionLower.includes('add comment') || questionLower.includes('add comments') || questionLower.includes('comment')) {
        // SPECIFIC: Add comments to code
        geminiPrompt = `Please add helpful comments to this ${language} code to explain complex parts.
        
        IMPORTANT: 
        1. Return ONLY the commented code, no explanations before or after
        2. Add comments where logic is complex or unclear
        3. Keep existing code exactly as is, just add comments
        4. Use // for single-line comments
        5. For multiline comments use /* */ if needed
        
        Here is the code:
        \`\`\`${language}
        ${fileContent}
        \`\`\`
        
        Now return the same code with comments added:`
      } else if (questionLower.includes('explain this') || questionLower.includes('what does this do')) {
        // SPECIFIC: Explain the code
        geminiPrompt = `Please explain what this ${language} code does in simple terms.
        
        Code:
        \`\`\`${language}
        ${fileContent.substring(0, 5000)}
        \`\`\`
        
        Explain in 2-3 paragraphs maximum:`
      } else if (questionLower.includes('refactor') || questionLower.includes('improve')) {
        // SPECIFIC: Refactor code
        geminiPrompt = `Please refactor this ${language} code to improve it.
        
        Code:
        \`\`\`${language}
        ${fileContent.substring(0, 5000)}
        \`\`\`
        
        Return the refactored code with brief explanations of changes:`
      } else {
        // GENERAL: Answer the specific question
        geminiPrompt = `User asked: "${message}"
        
        About this ${language} code:
        \`\`\`${language}
        ${fileContent.substring(0, 5000)}
        \`\`\`
        
        Please answer the user's question directly and concisely:`
      }

      try {
        // Use correct Gemini model (gemini-2.5-flash for free tier)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: geminiPrompt }]
            }],
            generationConfig: {
              maxOutputTokens: 4000,
              temperature: 0.3, // Lower temp for more focused responses
            }
          })
        })

        console.log(`📊 Gemini Response Status: ${response.status}`)
        
        if (response.ok) {
          const data = await response.json()
          console.log("✅ Gemini response received")
          
          if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            aiResponse = data.candidates[0].content.parts[0].text
            console.log(`✅ Gemini response: ${aiResponse.substring(0, 100)}...`)
          } else {
            console.log("❌ No text in Gemini response")
          }
        } else {
          const errorText = await response.text()
          console.error(`❌ Gemini API error ${response.status}:`, errorText.substring(0, 500))
          
          // Try gemini-2.0-flash as fallback
          if (response.status === 404) {
            console.log("🔄 Trying gemini-2.0-flash as fallback...")
            const fallbackResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{ text: geminiPrompt }]
                }],
                generationConfig: {
                  maxOutputTokens: 4000,
                  temperature: 0.3,
                }
              })
            })
            
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json()
              aiResponse = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || null
              console.log("✅ Gemini 2.0 response successful")
            }
          }
        }
      } catch (error) {
        console.error("❌ Gemini fetch failed:", error)
      }
    }

    // If Gemini failed or not configured, try Euron
    if (!aiResponse && hasEuronKey) {
      console.log("🔄 Gemini failed, trying Euron...")
      
      // Use focused prompt for Euron too
      let euronPrompt = `User asked: "${message}"
      
      About this ${language} code:
      \`\`\`${language}
      ${fileContent.substring(0, 6000)}
      \`\`\`
      
      Please answer the user's question directly and concisely.`

      try {
        const { createEuronCompletion } = await import("@/lib/euron")
        
        const response = await createEuronCompletion({
          messages: [
            { role: "system", content: "You are a helpful code assistant. Answer questions about code directly and concisely." },
            { role: "user", content: euronPrompt }
          ],
          max_tokens: 2000,
          temperature: 0.3,
          stream: false
        })

        const data = await response.json()
        aiResponse = data.choices?.[0]?.message?.content || null
        
        if (aiResponse) {
          console.log("✅ Euron response successful")
        }
      } catch (error) {
        console.error("❌ Euron failed:", error)
      }
    }

    // If AI didn't respond
    if (!aiResponse) {
      console.log("⚠️ No AI response, using local analysis")
      
      const issues = analyzeCodeLocally(fileContent, language, filename)
      
      if (questionLower.includes('add comment') || questionLower.includes('add comments') || questionLower.includes('comment')) {
        // Try to generate simple comments based on code structure
        const lines = fileContent.split('\n')
        let suggestedComments = []
        
        // Find component/function definitions
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          if (line.includes('export default') || line.includes('function ') || 
              line.includes('const ') && (line.includes('= () =>') || line.includes('= function'))) {
            // Found a function/component definition
            suggestedComments.push({
              line: i + 1,
              code: line.trim(),
              suggestion: `// TODO: Add description for this ${line.includes('function') ? 'function' : 'component'}`
            })
          }
        }
        
        aiResponse = `## 📝 Comment Suggestions for ${filename}

**Note:** AI services are unavailable. Here are some places where comments could be added:

${suggestedComments.map((s, idx) => 
  `${idx + 1}. **Line ${s.line}**: \`${s.code.substring(0, 60)}${s.code.length > 60 ? '...' : ''}\`\n   → ${s.suggestion}`
).join('\n\n')}

**To enable AI-powered code commenting:**
1. Ensure GEMINI_API_KEY is set in .env.local
2. Get a free key from: https://aistudio.google.com/app/apikey`
      } else {
        // Other questions without AI
        aiResponse = `## 🔧 AI Services Unavailable

I cannot answer "${message}" because AI services are not responding.

**What you can do:**
1. Check your API keys in .env.local
2. Get a free Gemini key from: https://aistudio.google.com/app/apikey
3. Try the local file viewer to read the code

**Current status:**
- ${hasGeminiKey ? '✅ Gemini key configured' : '❌ Gemini key missing'}
- ${hasEuronKey ? '✅ Euron key configured' : '❌ Euron key missing'}`
      }
    } else {
      console.log("✅ AI response generated successfully")
    }

    return NextResponse.json({ 
      success: true,
      message: aiResponse,
      usedAI: !!aiResponse && (hasEuronKey || hasGeminiKey)
    })
  } catch (error) {
    console.error("File chat error:", error)
    return NextResponse.json({ 
      error: "Failed to analyze file",
      fallback: true 
    }, { status: 500 })
  }
}