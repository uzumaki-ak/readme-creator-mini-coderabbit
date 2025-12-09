// Local code analyzer that works without API keys
export interface CodeIssue {
  type: 'security' | 'performance' | 'best-practice' | 'maintainability'
  message: string
  line?: number
  severity: 'low' | 'medium' | 'high'
}

export function analyzeCodeLocally(content: string, language: string, filename: string): CodeIssue[] {
  const issues: CodeIssue[] = []
  const lines = content.split('\n')
  
  // Common patterns to check for
  const securityPatterns = [
    { pattern: /api[_-]?key\s*[:=]\s*['"`]/, message: 'Hardcoded API key detected' },
    { pattern: /password\s*[:=]\s*['"`]/, message: 'Hardcoded password detected' },
    { pattern: /secret\s*[:=]\s*['"`]/, message: 'Hardcoded secret detected' },
    { pattern: /token\s*[:=]\s*['"`]/, message: 'Hardcoded token detected' },
    { pattern: /private[_-]?key\s*[:=]\s*['"`]/, message: 'Hardcoded private key detected' },
    { pattern: /\.env\.[a-z]+/, message: 'Potential environment variable file reference' },
  ]

  const performancePatterns = [
    { pattern: /for\s*\(\s*let\s+i\s*=\s*0\s*;\s*i\s*<\s*array\.length\s*;\s*i\+\+\s*\)/, message: 'Cache array length in loop for better performance' },
    { pattern: /console\.log\(/, message: 'Console.log in production code' },
    { pattern: /eval\(/, message: 'Avoid eval() for security and performance' },
    { pattern: /innerHTML\s*=/, message: 'Potential XSS vulnerability with innerHTML' },
  ]

  const bestPracticePatterns = [
    { pattern: /catch\s*\(\s*\)/, message: 'Empty catch block' },
    { pattern: /catch\s*\(\s*e\s*\)\s*\{\s*console\.log/, message: 'Generic error handling with only console.log' },
    { pattern: /any\s*[:=]/, message: 'Avoid using "any" type in TypeScript' },
    { pattern: /function\s+\w+\s*\([^)]*\)\s*\{[\s\S]{200,}/, message: 'Large function detected - consider breaking it down' },
  ]

  // Check each line for issues
  lines.forEach((line, index) => {
    const lineNumber = index + 1
    
    // Security checks
    securityPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(line)) {
        issues.push({
          type: 'security',
          message: `${message} - consider using environment variables`,
          line: lineNumber,
          severity: 'high'
        })
      }
    })

    // Performance checks
    performancePatterns.forEach(({ pattern, message }) => {
      if (pattern.test(line)) {
        issues.push({
          type: 'performance',
          message,
          line: lineNumber,
          severity: 'medium'
        })
      }
    })

    // Best practice checks
    bestPracticePatterns.forEach(({ pattern, message }) => {
      if (pattern.test(line)) {
        issues.push({
          type: 'best-practice',
          message,
          line: lineNumber,
          severity: 'low'
        })
      }
    })
  })

  // Check for file-specific issues
  if (filename.includes('config') || filename.includes('env')) {
    if (content.includes('localhost') || content.includes('127.0.0.1')) {
      issues.push({
        type: 'security',
        message: 'Hardcoded localhost URL in configuration file',
        severity: 'medium'
      })
    }
  }

  // Check for large files
  if (lines.length > 500) {
    issues.push({
      type: 'maintainability',
      message: `Large file detected (${lines.length} lines). Consider splitting into smaller modules.`,
      severity: 'medium'
    })
  }

  // Check for missing error handling in TypeScript/JavaScript
  if (language.toLowerCase().includes('typescript') || language.toLowerCase().includes('javascript')) {
    const hasErrorHandling = content.includes('try {') && content.includes('} catch')
    const hasAsyncErrorHandling = content.includes('.catch(')
    
    if (!hasErrorHandling && !hasAsyncErrorHandling && content.includes('async')) {
      issues.push({
        type: 'best-practice',
        message: 'Async functions without error handling detected',
        severity: 'medium'
      })
    }
  }

  return issues.slice(0, 10) // Limit to 10 issues
}

export function generateLocalAnalysisReport(issues: CodeIssue[], filename: string, language: string): string {
  if (issues.length === 0) {
    return `## 📊 Local Code Analysis: ${filename}

**No major issues found!** ✅

This file looks clean based on basic static analysis.

*Note: This is a basic analysis. For more in-depth review, configure AI APIs.*`
  }

  const issueCounts = {
    security: issues.filter(i => i.type === 'security').length,
    performance: issues.filter(i => i.type === 'performance').length,
    'best-practice': issues.filter(i => i.type === 'best-practice').length,
    maintainability: issues.filter(i => i.type === 'maintainability').length,
  }

  let report = `## 📊 Local Code Analysis: ${filename}

**Language:** ${language}
**Total Issues Found:** ${issues.length}

### Summary:
${Object.entries(issueCounts).map(([type, count]) => `- **${type}:** ${count}`).join('\n')}

### Detailed Issues:
`

  issues.forEach((issue, index) => {
    report += `\n**${index + 1}. ${issue.type.toUpperCase()} - ${issue.severity.toUpperCase()}**\n`
    report += `${issue.message}\n`
    if (issue.line) {
      report += `*Line ${issue.line}*\n`
    }
  })

  report += `\n---
*Note: This is a basic static analysis. For AI-powered code review, please configure API keys.*`

  return report
}