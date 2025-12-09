export interface SearchResult {
  file_path: string
  content: string
  relevance: number
  matches: string[]
}

export function searchFiles(files: Array<{file_path: string, content: string}>, query: string): SearchResult[] {
  const queryLower = query.toLowerCase()
  const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 2)
  
  if (queryTerms.length === 0) return []
  
  const results: SearchResult[] = []
  
  for (const file of files) {
    let relevance = 0
    const contentLower = file.content.toLowerCase()
    const fileName = file.file_path.toLowerCase()
    const matches: string[] = []
    
    // Check for exact matches in file name
    for (const term of queryTerms) {
      if (fileName.includes(term)) {
        relevance += 15
        matches.push(`File name contains "${term}"`)
      }
    }
    
    // Check for file path patterns
    if (fileName.includes('api') || fileName.includes('route') || fileName.includes('endpoint')) {
      relevance += 10
      matches.push('File path suggests API')
    }
    
    // Check for content patterns
    const lines = file.content.split('\n')
    
    // Look for API patterns in content
    const apiPatterns = [
      /app\.(get|post|put|delete|patch)\s*\(/gi,
      /router\.(get|post|put|delete|patch)\s*\(/gi,
      /fetch\s*\(/gi,
      /axios\.(get|post|put|delete|patch)\s*\(/gi,
      /@app\.(get|post|put|delete|patch)/gi,
      /@Route/gi,
      /api\s*:/gi,
      /\/api\//gi,
    ]
    
    let apiMatches = 0
    for (const pattern of apiPatterns) {
      const match = file.content.match(pattern)
      if (match) {
        apiMatches += match.length
      }
    }
    
    if (apiMatches > 0) {
      relevance += apiMatches * 5
      matches.push(`Found ${apiMatches} API endpoint patterns`)
    }
    
    // Check for query terms in content
    for (const term of queryTerms) {
      const termMatches = contentLower.match(new RegExp(term, 'g')) || []
      if (termMatches.length > 0) {
        relevance += termMatches.length * 2
        matches.push(`Contains "${term}" ${termMatches.length} times`)
      }
    }
    
    // Find specific lines with query terms
    for (let i = 0; i < Math.min(lines.length, 30); i++) {
      const line = lines[i]
      const lineLower = line.toLowerCase()
      
      // Check if line contains any query term
      const containsTerm = queryTerms.some(term => term.length > 2 && lineLower.includes(term))
      const containsAPI = lineLower.includes('api') || lineLower.includes('route') || lineLower.includes('endpoint')
      
      if (containsTerm || containsAPI) {
        // Check for HTTP methods
        if (line.includes('GET') || line.includes('POST') || line.includes('PUT') || 
            line.includes('DELETE') || line.includes('PATCH')) {
          relevance += 20
          matches.push(`Line ${i + 1}: ${line.trim().substring(0, 100)}`)
        } else if (containsTerm) {
          relevance += 10
          matches.push(`Line ${i + 1}: ${line.trim().substring(0, 100)}`)
        }
      }
    }
    
    // Bonus for certain file types
    if (file.file_path.endsWith('.ts') || file.file_path.endsWith('.js') || 
        file.file_path.endsWith('.tsx') || file.file_path.endsWith('.jsx')) {
      relevance += 3
    }
    if (file.file_path.endsWith('.json')) {
      relevance += 2
    }
    
    if (relevance > 0) {
      results.push({
        file_path: file.file_path,
        content: file.content,
        relevance,
        matches: matches.slice(0, 3) // Limit to top 3 matches
      })
    }
  }
  
  // Sort by relevance and limit results
  return results
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 10)
}

// Simple test function
export function testSearch() {
  const testFiles = [
    {
      file_path: 'api/user.ts',
      content: `import { Router } from 'express'
const router = Router()

router.get('/users', (req, res) => {
  res.json({ users: [] })
})

router.post('/users', (req, res) => {
  res.json({ created: true })
})`
    },
    {
      file_path: 'pages/index.tsx',
      content: `export default function Home() {
  return <div>Home page</div>
}`
    },
    {
      file_path: 'package.json',
      content: `{
  "name": "test",
  "scripts": {
    "dev": "next dev"
  }
}`
    }
  ]
  
  const results = searchFiles(testFiles, 'find api endpoints')
  console.log('Test search results:', results)
  return results
}