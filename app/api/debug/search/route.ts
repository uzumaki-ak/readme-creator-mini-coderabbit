import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { searchFiles } from "@/lib/search"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, query } = await request.json()
    
    if (!projectId || !query) {
      return NextResponse.json({ error: "Project ID and query required" }, { status: 400 })
    }

    // Get project files
    const { data: files } = await supabase
      .from("project_files")
      .select("file_path, content")
      .eq("project_id", projectId)

    if (!files) {
      return NextResponse.json({ error: "No files found" }, { status: 404 })
    }

    // Test the search
    const results = searchFiles(files, query)
    
    // Format results for debugging
    const debugResults = results.map(r => ({
      file: r.file_path,
      relevance: r.relevance,
      matches: r.matches,
      content_preview: r.content.substring(0, 200) + '...',
      has_api_patterns: r.content.includes('router.') || r.content.includes('app.') || 
                        r.content.includes('GET') || r.content.includes('POST')
    }))

    return NextResponse.json({
      success: true,
      query,
      total_files: files.length,
      results_count: results.length,
      results: debugResults
    })
  } catch (error) {
    console.error("Search debug error:", error)
    return NextResponse.json({ error: "Search debug failed" }, { status: 500 })
  }
}