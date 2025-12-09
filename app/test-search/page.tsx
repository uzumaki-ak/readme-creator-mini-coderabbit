"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export default function TestSearchPage() {
  const [projectId, setProjectId] = useState("")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleTest = async () => {
    if (!projectId.trim() || !query.trim()) {
      setError("Please enter both project ID and query")
      return
    }

    setLoading(true)
    setError("")
    
    try {
      const response = await fetch("/api/debug/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, query })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Test failed")
      }
      
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Search Debug Tool</h1>
      
      <Card className="mb-6">
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Project ID</label>
            <Input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="Enter project ID"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Search Query</label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., find api endpoints"
              className="w-full"
            />
          </div>
          
          <Button onClick={handleTest} disabled={loading}>
            {loading ? "Testing..." : "Test Search"}
          </Button>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded">
              Error: {error}
            </div>
          )}
        </CardContent>
      </Card>
      
      {results && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Results</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Query:</strong> {results.query}
                </div>
                <div>
                  <strong>Total Files:</strong> {results.total_files}
                </div>
                <div>
                  <strong>Matches Found:</strong> {results.results_count}
                </div>
              </div>
              
              {results.results.map((result: any, index: number) => (
                <Card key={index} className="p-4">
                  <h3 className="font-bold mb-2">{result.file}</h3>
                  <div className="text-sm text-gray-600 mb-2">
                    Relevance: {result.relevance} | 
                    Has API patterns: {result.has_api_patterns ? "Yes" : "No"}
                  </div>
                  <div className="mb-2">
                    <strong>Matches:</strong> {result.matches.join(", ")}
                  </div>
                  <div>
                    <strong>Preview:</strong>
                    <pre className="text-xs bg-gray-50 p-2 mt-1 overflow-auto">
                      {result.content_preview}
                    </pre>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}