// Gemini AI API client
export interface GeminiMessage {
  parts: { text: string }[]
  role: 'user' | 'model'
}

export interface GeminiOptions {
  contents: GeminiMessage[]
  maxOutputTokens?: number
  temperature?: number
}

const GEMINI_MODELS = [
  'gemini-2.5-flash', // Latest free
  'gemini-2.0-flash', // Alternative free
  'gemini-1.5-flash'  // Old (might not work)
]

export async function createGeminiCompletion(prompt: string, options?: Partial<GeminiOptions>) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  // Try each model until one works
  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            maxOutputTokens: options?.maxOutputTokens || 4000,
            temperature: options?.temperature || 0.7,
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        
        if (text) {
          console.log(`✅ Gemini (${model}) response successful`)
          return { text, model }
        }
      } else if (response.status === 404) {
        console.log(`⚠️ Gemini model ${model} not found, trying next...`)
        continue // Try next model
      } else {
        const error = await response.text()
        console.error(`❌ Gemini (${model}) error:`, error.substring(0, 200))
        break // Stop on other errors
      }
    } catch (error) {
      console.error(`❌ Gemini (${model}) fetch failed:`, error)
      break // Stop on network errors
    }
  }

  throw new Error("All Gemini models failed")
}