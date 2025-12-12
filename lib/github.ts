export interface GitHubFile {
  path: string
  content: string
  type: 'file' | 'dir'
  size: number
}

export async function fetchGitHubRepo(owner: string, repo: string): Promise<{
  files: Array<{ path: string; content: string }>
  fileCount: number
}> {
  console.log(`📡 Fetching GitHub repo: ${owner}/${repo}`)
  
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'ReadmeGen-App'
  }
  
  // Add authorization if token exists
  if (GITHUB_TOKEN && (GITHUB_TOKEN.startsWith('ghp_') || GITHUB_TOKEN?.startsWith('ghs_'))) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`
    console.log("🔑 Using GitHub token for API calls")
  } else if (GITHUB_TOKEN) {
    console.log("⚠️ Invalid GitHub token format. Token should start with ghp_ or ghs_")
  }

  async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options)
        
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get('x-ratelimit-remaining')
          const resetTime = response.headers.get('x-ratelimit-reset')
          
          if (rateLimitRemaining === '0' && resetTime) {
            const resetDate = new Date(parseInt(resetTime) * 1000)
            const waitTime = resetDate.getTime() - Date.now() + 1000
            
            if (waitTime > 0 && i < retries - 1) {
              console.log(`⏳ Rate limit exceeded. Waiting ${Math.ceil(waitTime / 1000)} seconds...`)
              await new Promise(resolve => setTimeout(resolve, waitTime))
              continue
            }
          }
        }
        
        return response
      } catch (error) {
        if (i === retries - 1) throw error
        console.log(`🔄 Retry ${i + 1}/${retries} after error:`, error)
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
    throw new Error('Max retries exceeded')
  }

  async function getRepoTreeRecursive(owner: string, repo: string, branch: string): Promise<any[]> {
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
    
    try {
      const response = await fetchWithRetry(treeUrl, { headers })
      
      if (!response.ok) {
        // If recursive fails (too large), fall back to manual traversal
        if (response.status === 422) {
          console.log("📦 Repository too large for recursive fetch, using manual traversal...")
          return await getRepoTreeManually(owner, repo, branch)
        }
        throw new Error(`Failed to fetch repo tree: ${response.status}`)
      }
      
      const treeData = await response.json()
      return treeData.tree || []
    } catch (error) {
      console.error("Failed to fetch tree recursively:", error)
      return await getRepoTreeManually(owner, repo, branch)
    }
  }

  async function getRepoTreeManually(owner: string, repo: string, branch: string): Promise<any[]> {
    console.log("🌳 Starting manual tree traversal...")
    const allFiles: any[] = []
    const queue: string[] = ['']
    
    while (queue.length > 0) {
      const currentPath = queue.shift()!
      const treeUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${currentPath}?ref=${branch}`
      
      try {
        const response = await fetchWithRetry(treeUrl, { headers })
        
        if (!response.ok) {
          console.log(`⚠️ Failed to fetch directory ${currentPath || 'root'}: ${response.status}`)
          continue
        }
        
        const contents = await response.json()
        
        if (Array.isArray(contents)) {
          for (const item of contents) {
            if (item.type === 'file') {
              allFiles.push({
                path: item.path,
                type: 'blob',
                size: item.size || 0
              })
            } else if (item.type === 'dir') {
              queue.push(item.path)
            }
          }
        }
        
        // Delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        console.log(`⚠️ Error fetching ${currentPath}:`, error)
      }
      
      console.log(`📊 Manual traversal: Found ${allFiles.length} files, ${queue.length} dirs remaining`)
    }
    
    return allFiles
  }

  async function getFilePriority(path: string): Promise<number> {
    const pathLower = path.toLowerCase()
    
    // Highest priority
    if (pathLower === 'package.json') return 100
    if (pathLower === 'readme.md') return 90
    if (pathLower.includes('readme')) return 80
    
    // Source code files
    if (pathLower.endsWith('.ts') || pathLower.endsWith('.js') || 
        pathLower.endsWith('.tsx') || pathLower.endsWith('.jsx')) {
      if (pathLower.includes('src/') || pathLower.includes('/src/')) return 70
      if (pathLower.includes('app/') || pathLower.includes('/app/')) return 65
      if (pathLower.includes('pages/') || pathLower.includes('/pages/')) return 60
      return 50
    }
    
    // Configuration files
    if (pathLower.endsWith('.json') || pathLower.endsWith('.yml') || 
        pathLower.endsWith('.yaml') || pathLower.endsWith('.toml') ||
        pathLower.endsWith('.env') || pathLower.includes('config')) {
      return 40
    }
    
    // Other text files
    if (pathLower.endsWith('.md') || pathLower.endsWith('.txt') || 
        pathLower.endsWith('.sql') || pathLower.includes('documentation')) {
      return 30
    }
    
    return 10
  }

  try {
    // First, get repository info
    const repoInfoResponse = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}`, { headers })

    if (!repoInfoResponse.ok) {
      if (repoInfoResponse.status === 404) {
        throw new Error(`GitHub repository not found: ${owner}/${repo}`)
      } else if (repoInfoResponse.status === 403) {
        const rateLimitRemaining = repoInfoResponse.headers.get('x-ratelimit-remaining')
        console.log(`⚠️ GitHub API rate limit: ${rateLimitRemaining} remaining`)
        
        if (rateLimitRemaining === '0') {
          const resetTime = repoInfoResponse.headers.get('x-ratelimit-reset')
          const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : null
          throw new Error(`GitHub API rate limit exceeded. Reset at: ${resetDate?.toLocaleTimeString()}`)
        }
      }
      throw new Error(`GitHub API error: ${repoInfoResponse.status}`)
    }

    const repoInfo = await repoInfoResponse.json()
    const defaultBranch = repoInfo.default_branch || 'main'
    
    console.log(`📊 Repository info: ${repoInfo.size || 0}KB, ${repoInfo.stargazers_count || 0} stars, ${defaultBranch} branch`)
    
    // Get all files from repository
    const allFiles = await getRepoTreeRecursive(owner, repo, defaultBranch)
    
    console.log(`📁 Found ${allFiles.length} total items in ${owner}/${repo}`)
    
    // Filter for files only (not directories) and sort by priority
    const filesOnly = allFiles.filter((item: any) => item.type === 'blob')
    
    // Calculate priority for each file
    const filesWithPriority = await Promise.all(
      filesOnly.map(async (file: any) => ({
        ...file,
        priority: await getFilePriority(file.path)
      }))
    )
    
    // Sort by priority (highest first)
    filesWithPriority.sort((a, b) => b.priority - a.priority)
    
    // Remove the 50-file limit - fetch ALL files
    const selectedFiles = filesWithPriority
    
    console.log(`🎯 Selected ${selectedFiles.length} files for processing (all files)`)
    
    // Define text file extensions
    const textExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp',
      '.cs', '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala', '.vue',
      '.svelte', '.html', '.css', '.scss', '.sass', '.less', '.json', '.xml',
      '.yaml', '.yml', '.md', '.txt', '.sh', '.bash', '.zsh', '.fish',
      '.dockerfile', '.gitignore', '.env.example', '.toml', '.ini', '.cfg',
      '.sql', '.graphql', '.prisma', '.proto'
    ]

    // Fetch file contents
    const textFiles: Array<{ path: string; content: string }> = []
    
    const batchSize = GITHUB_TOKEN ? 8 : 4
    const delayBetweenBatches = GITHUB_TOKEN ? 800 : 1500
    
    console.log(`⚙️ Using batch size: ${batchSize}, delay: ${delayBetweenBatches}ms`)
    console.log(`📦 Processing all ${selectedFiles.length} files...`)
    
    for (let i = 0; i < selectedFiles.length; i += batchSize) {
      const batch = selectedFiles.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (file: any) => {
        const path = file.path
        
        // Skip ignored patterns
        if (shouldIgnoreGitHubPath(path)) {
          return null
        }

        // Check if it's a text file
        const isTextFile = textExtensions.some(ext => path.toLowerCase().endsWith(ext)) ||
                          path.toLowerCase() === 'dockerfile' ||
                          path.toLowerCase() === 'makefile' ||
                          path.toLowerCase() === 'readme' ||
                          path.toLowerCase() === 'license' ||
                          path.toLowerCase() === 'package.json'

        if (!isTextFile) {
          return null
        }

        try {
          const contentResponse = await fetchWithRetry(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
            {
              headers: {
                ...headers,
                'Accept': 'application/vnd.github.v3.raw'
              }
            }
          )

          if (!contentResponse.ok) {
            console.log(`⚠️ Failed to fetch ${path}: ${contentResponse.status}`)
            return null
          }

          const content = await contentResponse.text()
          
          // Limit file size for processing
          if (content.length > 100000) {
            console.log(`⚠️ Skipping large file ${path}: ${content.length} chars`)
            return null
          }

          console.log(`✅ Fetched ${path} (${content.length} chars)`)
          return { path, content }
        } catch (error) {
          console.log(`⚠️ Error fetching ${path}:`, error)
          return null
        }
      })

      const batchResults = await Promise.all(batchPromises)
      const validFiles = batchResults.filter(Boolean) as Array<{ path: string; content: string }>
      textFiles.push(...validFiles)
      
      // Show progress
      console.log(`📊 Progress: ${textFiles.length}/${selectedFiles.length} files fetched`)
      
      // Delay between batches
      if (i + batchSize < selectedFiles.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
      }
    }

    console.log(`✅ Successfully fetched ${textFiles.length} text files from GitHub`)
    
    // Log what we got
    if (textFiles.length > 0) {
      console.log("📋 Files fetched:")
      textFiles.slice(0, 10).forEach((file, idx) => {
        console.log(`  ${idx + 1}. ${file.path} (${file.content.length} chars)`)
      })
      if (textFiles.length > 10) {
        console.log(`  ... and ${textFiles.length - 10} more files`)
      }
    }
    
    return {
      files: textFiles,
      fileCount: filesOnly.length
    }
  } catch (error) {
    console.error('❌ GitHub fetch error:', error)
    throw error
  }
}

function shouldIgnoreGitHubPath(path: string): boolean {
  const ignoredPatterns = [
    'node_modules/',
    '.git/',
    '__pycache__/',
    '.next/',
    'dist/',
    'build/',
    '.venv/',
    'venv/',
    '.DS_Store',
    '.env',
    '.env.local',
    '.env.production',
    '.env.example',
    '.env.development',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '*.log',
    '*.tmp',
    '*.temp',
    '*.min.js',
    '*.min.css',
    '*.map',
    'coverage/',
    '.vscode/',
    '.idea/',
    '*.sublime-*',
    '.editorconfig',
    '*.jpg',
    '*.jpeg',
    '*.png',
    '*.gif',
    '*.svg',
    '*.ico',
    '*.woff',
    '*.woff2',
    '*.ttf',
    '*.eot',
    '*.mp4',
    '*.webm',
    '*.mp3',
    '*.wav',
    '*.pdf',
    '*.zip',
    '*.tar',
    '*.gz'
  ]

  const filename = path.split('/').pop() || ''
  const pathLower = path.toLowerCase()

  return ignoredPatterns.some((pattern) => {
    if (pattern.endsWith('/')) {
      return pathLower.includes(pattern)
    }
    if (pattern.startsWith('*.')) {
      const ext = pattern.slice(1)
      return filename.toLowerCase().endsWith(ext)
    }
    return filename === pattern || pathLower.includes(pattern)
  })
}