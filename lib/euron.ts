// Euron AI API client
export interface EuronMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface EuronCompletionOptions {
  messages: EuronMessage[]
  model?: string
  max_tokens?: number
  temperature?: number
  stream?: boolean
}

const EURON_API_URL = "https://api.euron.one/api/v1/euri/chat/completions"

// Remove the key format validation entirely
export async function createEuronCompletion(options: EuronCompletionOptions) {
  const apiKey = process.env.EURON_API_KEY

  if (!apiKey) {
    console.error("❌ EURON_API_KEY is not configured")
    throw new Error("EURON_API_KEY is not configured")
  }

  console.log(`📡 Calling Euron API... Key length: ${apiKey.length}`)
  console.log(`📝 Message count: ${options.messages.length}`)
  
  const requestBody = {
    messages: options.messages,
    model: options.model || process.env.EURON_MODEL || "gpt-4.1-nano",
    max_tokens: options.max_tokens || 4000,
    temperature: options.temperature || 0.7,
    stream: options.stream ?? false,
  }

  console.log(`🤖 Model: ${requestBody.model}`)

  try {
    const response = await fetch(EURON_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    console.log(`📊 Response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      let errorText = await response.text()
      console.error(`❌ Euron API error ${response.status}:`, errorText.substring(0, 300))
      
      // Check for specific error types
      if (response.status === 403 && errorText.includes('Daily token limit')) {
        throw new Error("EURON_DAILY_LIMIT_REACHED")
      }
      throw new Error(`Euron API error: ${response.status} - ${errorText.substring(0, 200)}`)
    }

    console.log("✅ Euron API call successful")
    return response
  } catch (error) {
    if (error instanceof Error && error.message === "EURON_DAILY_LIMIT_REACHED") {
      throw error
    }
    console.error("❌ Euron fetch failed:", error)
    throw new Error(`Failed to call Euron API: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
export async function createEuronStreamingCompletion(options: Omit<EuronCompletionOptions, "stream">) {
  const apiKey = process.env.EURON_API_KEY

  if (!apiKey) {
    throw new Error("EURON_API_KEY is not configured")
  }

  const response = await fetch(EURON_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages: options.messages,
      model: options.model || process.env.EURON_MODEL || "gpt-4.1-nano",
      max_tokens: options.max_tokens || 4000,
      temperature: options.temperature || 0.7,
      stream: true,
    }),
  })

  if (!response.ok) {
    let errorMessage = `Euron API error: ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage += ` - ${JSON.stringify(errorData)}`
    } catch {
      const text = await response.text()
      errorMessage += ` - ${text}`
    }
    throw new Error(errorMessage)
  }

  return response
}